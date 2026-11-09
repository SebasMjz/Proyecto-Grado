from django.conf import settings
from rest_framework import generics, viewsets, status, views
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.exceptions import ValidationError as APIValidationError
from django.db.models import Q
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError



from django.utils import timezone
import uuid
import threading
import time

from checkvris.models import (
    User, PasswordResetCode, Event, EventSession, Participant, Registration,
    Attendance, Certificate, TypeParticipant, StatusRegistration,
    EmailDeliveryLog
)
from checkvris.serializers import (
    LoginSerializer, EmailActivationSerializer, PublicSignUpSerializer,
    EventSerializer, EventSessionSerializer, ParticipantSerializer,
    RegistrationSerializer, AttendanceSerializer, CertificateSerializer, UserSerializer,
    EmailDeliveryLogSerializer
)
from checkvris.utils import generate_activation_code, send_email_activation, send_email_password_reset, send_email_qr_code
from checkvris.permissions import IsInstitutionalUser, CertificateAccessPermission
from django.http import HttpResponse
from django.core.mail import send_mail
import logging
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3
from web3.exceptions import TransactionNotFound
from checkvris.blockchain import submit_certificate, sync_certificate, verify_certificate

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            #user = serializer.validated_data
            #refresh = RefreshToken.for_user(user)
            #return Response({
            #    "refresh": str(refresh),
            #    "access": str(refresh.access_token),
            #})
            return Response(serializer.validated_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PublicSignUpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PublicSignUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                user = serializer.save()
                activation_code = generate_activation_code()
                PasswordResetCode.objects.create(user=user, code=activation_code)
                send_email_activation(user, activation_code)
        except Exception:
            return Response(
                {'detail': 'No pudimos enviar el código de activación. Inténtalo de nuevo.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {'message': 'Cuenta creada. Revisa tu correo para activar el acceso.'},
            status=status.HTTP_201_CREATED,
        )


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class WalletChallengeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'member':
            raise APIValidationError('Solo participantes pueden vincular una billetera.')
        request.user.wallet_challenge = uuid.uuid4()
        request.user.save(update_fields=['wallet_challenge'])
        return Response({'message': f"VRIS: vincular billetera a {request.user.email}\nNonce: {request.user.wallet_challenge}"})

    def post(self, request):
        user = request.user
        address = request.data.get('address', '')
        signature = request.data.get('signature', '')
        if user.user_type != 'member' or not user.wallet_challenge or not Web3.is_address(address):
            raise APIValidationError('Solicita un desafío e indica una billetera válida.')
        message = f"VRIS: vincular billetera a {user.email}\nNonce: {user.wallet_challenge}"
        try:
            signer = Account.recover_message(encode_defunct(text=message), signature=signature)
        except (ValueError, TypeError):
            raise APIValidationError('La firma de la billetera no es válida.')
        if signer.lower() != address.lower():
            raise APIValidationError('La firma no corresponde a la billetera indicada.')
        if User.objects.filter(wallet_address__iexact=address).exclude(pk=user.pk).exists():
            raise APIValidationError('Esta billetera ya está vinculada a otra cuenta.')
        if user.wallet_address and user.wallet_address.lower() != address.lower() and Certificate.objects.filter(
            recipient_email__iexact=user.email, blockchain_status__in=['pending_chain', 'confirmed'],
        ).exists():
            raise APIValidationError('No se puede cambiar una billetera con certificados registrados en blockchain.')
        user.wallet_address = Web3.to_checksum_address(address)
        user.wallet_challenge = None
        user.save(update_fields=['wallet_address', 'wallet_challenge'])
        return Response({'wallet_address': user.wallet_address})

class ActivateAccountView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailActivationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            activation_code = serializer.validated_data['activation_code']
            new_password = request.data.get('new_password')

            try:
                user = User.objects.get(email=email)
                code_obj = PasswordResetCode.objects.get(user=user, code=activation_code)

                if not user.has_usable_password() and not new_password:
                    return Response({'error': 'Define una contraseña para activar tu cuenta.'}, status=400)
                if new_password:
                    try:
                        validate_password(new_password, user)
                    except ValidationError as error:
                        return Response({'error': error.messages[0]}, status=400)

                # Activate the user
                user.is_active = True
                if new_password:
                    user.set_password(new_password)
                user.save()

                # Delete the activation code
                code_obj.delete()

                return Response({
                    'message': 'Cuenta activada correctamente. Ya puedes iniciar sesión.'
                }, status=200)

            except (User.DoesNotExist, PasswordResetCode.DoesNotExist):
                return Response({
                    'error': 'Código de activación inválido.'
                }, status=400)

        return Response(serializer.errors, status=400)

class ResendActivationCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        try:
            user = User.objects.get(email=email)

            if user.is_active:
                return Response({
                    'error': 'Esta cuenta ya está activada.'
                }, status=400)

            # Generate new activation code
            activation_code = generate_activation_code()

            # Remove old codes and create new one
            PasswordResetCode.objects.filter(user=user).delete()
            PasswordResetCode.objects.create(user=user, code=activation_code)

            # Send activation email
            try:
                send_email_activation(user, activation_code)
                return Response({
                    'message': 'Código de activación reenviado correctamente.'
                }, status=200)
            except Exception:
                return Response({
                    'error': 'Error enviando el email de activación.'
                }, status=500)

        except User.DoesNotExist:
            return Response({
                'error': 'No existe una cuenta con este email.'
            }, status=404)


class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)

            user.generate_reset_token()

            reset_url = f"{settings.FRONTEND_URL}/auth/reset-password/{user.reset_token}"

            send_email_password_reset(user, reset_url)

            return Response({'message': 'Correo enviado para restablecer la contraseña.'}, status=200)

        except User.DoesNotExist:
            return Response({'error': 'No existe una cuenta con ese email.'}, status=404)

class ConfirmPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not token or not new_password:
            return Response({'error': 'El enlace y la nueva contraseña son obligatorios.'}, status=400)

        try:
            user = User.objects.get(reset_token=uuid.UUID(str(token)))
            if not user.is_reset_token_valid():
                return Response({'error': 'Token expirado o inválido.'}, status=400)

            try:
                validate_password(new_password, user)
            except ValidationError as error:
                return Response({'error': error.messages[0]}, status=400)

            user.set_password(new_password)
            user.reset_token = None
            user.reset_token_created_at = None
            user.save()

            return Response({'message': 'Contraseña actualizada correctamente.'}, status=200)

        except (User.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'Token inválido.'}, status=404)

# Paginación personalizada para usuarios (más registros por página)
class UserPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# --- USER CRUD ---
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("last_name")
    serializer_class = UserSerializer
    permission_classes = [IsInstitutionalUser]
    pagination_class = UserPagination  # Usar paginación personalizada
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["first_name", "last_name", "email"]
    ordering_fields = ["date_joined", "last_name", "first_name"]
    filterset_fields = ["user_type", "is_active", "is_staff"]

    def create(self, request, *args, **kwargs):
        """
        Crea un usuario minimal (email + user_type) inactivo y envía código de activación
        para que el propio usuario complete su registro (nombre y contraseña).
        """
        email = request.data.get('email')
        user_type = request.data.get('user_type', 'staff')
        if not email:
            return Response({"detail": "El email es obligatorio"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"detail": "Ya existe un usuario con ese email"}, status=status.HTTP_400_BAD_REQUEST)

        # Crear usuario con nombres temporales (el modelo no permite en blanco)
        user = User.objects.create(
            email=email,
            first_name=request.data.get('first_name') or 'Pendiente',
            last_name=request.data.get('last_name') or 'Registro',
            user_type=user_type,
            is_active=False,
            is_staff=True if user_type == 'admin' else False,
        )
        user.set_unusable_password()
        user.save()

        # Generar y enviar código de activación
        activation_code = generate_activation_code()
        PasswordResetCode.objects.filter(user=user).delete()
        PasswordResetCode.objects.create(user=user, code=activation_code)
        try:
            send_email_activation(user, activation_code)
        except Exception:
            pass

        data = UserSerializer(user).data
        data.update({
            'activation_sent': True
        })
        return Response(data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Actualizar usuario existente"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Eliminar usuario"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

# --- PARTICIPANT CRUD ---
class ParticipantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsInstitutionalUser]
    queryset = Participant.objects.all().order_by("last_name")
    serializer_class = ParticipantSerializer
    pagination_class = None  # Desactivar paginación para cargar todos los participantes
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["first_name", "last_name", "email", "identification_number", "phone"]
    ordering_fields = ["created_at", "last_name", "first_name"]
    filterset_fields = ["type", "career"]  # Permitir filtrar por tipo y carrera

    @action(detail=False, methods=['post'], url_path='bulk_upload')
    def bulk_upload(self, request):
        """
        Carga masiva de participantes desde un archivo Excel.
        Columnas esperadas: first_name, last_name, email, phone, identification_number, type, career(opcional)
        
        Parámetros URL:
        - event=<id>: Registra a cada participante al evento (sin duplicar)
        - send_emails=true/false: Si se envía correos automáticamente (default: true)
        
        NOTA: Los correos se envían en background (asíncrono) para no bloquear la respuesta.
        Para cargas muy grandes (>100 participantes), se puede desactivar con send_emails=false
        y luego usar el endpoint send_qr_emails_bulk para enviar correos después.
        """
        upload = request.FILES.get('file')
        if not upload:
            return Response({"detail": "Archivo no enviado (campo 'file')"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from openpyxl import load_workbook
        except ImportError as e:
            return Response({
                "detail": "openpyxl no está instalado en el servidor. Por favor, instálelo ejecutando: pip install openpyxl",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            wb = load_workbook(upload)
            ws = wb.active
        except Exception:
            return Response({"detail": "No se pudo leer el archivo Excel"}, status=status.HTTP_400_BAD_REQUEST)

        headers = [cell.value for cell in next(ws.rows)]

        # Normalizar encabezados: permitir variantes con mayúsculas/espacios
        def _normalize(h):
            if not h:
                return ""
            s = str(h).strip().lower()
            s = s.replace(" ", "_")
            # remover caracteres no alfanuméricos/underscore
            s = "".join(ch for ch in s if ch.isalnum() or ch == "_")
            # alias comunes
            if s in ("identification_number", "identificationnumber", "cedula_de_identidad", "documento", "document_number", "ci", "cedula", "carnet_de_identidad"):
                return "identification_number"
            if s in ("email", "correo", "correo_electronico", "correo_electrnico", "e_mail"):
                return "email"
            if s in ("phone", "telefono", "tel", "telfono", "celular"):
                return "phone"
            if s in ("first_name", "firstname", "first", "nombre", "nombres"):
                return "first_name"
            if s in ("last_name", "lastname", "last", "apellido", "apellidos"):
                return "last_name"
            if s in ("type", "tipo", "nivel_academico", "nivel_acad", "nivel_acadmico", "nivelacademico"):
                return "type"
            if s in ("career", "carrera", "profesion", "profesin", "area_de_trabajo"):
                return "career"
            return s

        normalized_headers = [_normalize(h) for h in headers]

        required = ["first_name", "last_name", "email", "identification_number", "type"]
        for col in required:
            if col not in normalized_headers:
                return Response({"detail": f"Falta columna obligatoria: {col}"}, status=status.HTTP_400_BAD_REQUEST)

        header_index = {h: i for i, h in enumerate(normalized_headers)}

        event_id = request.query_params.get('event')
        event = None
        if event_id:
            event = get_object_or_404(Event, id=event_id)
            if event.attendance_closed_at:
                raise APIValidationError('La asistencia del evento ya está cerrada.')

        # Parámetro opcional para enviar correos (por defecto True - envía correos automáticamente)
        # Si la carga es muy grande (>100), se puede desactivar con send_emails=false
        send_emails_param = request.query_params.get('send_emails', 'true').lower()
        send_emails = send_emails_param != 'false'  # Por defecto True, solo False si se especifica explícitamente
        
        created_participants = 0
        updated_participants = 0
        created_registrations = 0
        emails_sent = 0
        emails_failed = 0
        skipped_rows = []
        
        # Lista para almacenar registros que necesitan correo (se enviarán en background)
        registrations_to_email = []

        for row_num, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            try:
                data = {
                    'first_name': str(row[header_index['first_name']] or '').strip(),
                    'last_name': str(row[header_index['last_name']] or '').strip(),
                    'email': str(row[header_index['email']] or '').strip(),
                    'phone': str(row[header_index['phone']] or '').strip() if 'phone' in header_index else '',
                    'identification_number': str(row[header_index['identification_number']] or '').strip(),
                    'type': str(row[header_index['type']] or '').strip(),
                    'career': str(row[header_index['career']] or '').strip() if 'career' in header_index else None,
                }

                if not data['first_name'] or not data['last_name'] or not data['email']:
                    skipped_rows.append({'row': row_num, 'reason': 'Campos básicos vacíos'})
                    continue

                # Normalizar tipo
                t = data['type'].lower()
                if t.startswith('est'):
                    data['type'] = TypeParticipant.STUDENT
                elif t.startswith('pro'):
                    data['type'] = TypeParticipant.PROFESSIONAL
                elif t.startswith('arq.'):
                    data['type'] = TypeParticipant.ARQ
                elif t.startswith('dr.'):
                    data['type'] = TypeParticipant.DR
                elif t.startswith('dra.'):
                    data['type'] = TypeParticipant.DRA
                elif t == 'ing.':
                    data['type'] = TypeParticipant.ING
                elif t == 'ing.m.sc.':
                    data['type'] = TypeParticipant.INGMSC
                elif t == 'lic.':
                    data['type'] = TypeParticipant.LIC
                elif t == 'lic.m.sc.':
                    data['type'] = TypeParticipant.LICMSC
                elif t.startswith('ph.d.'):
                    data['type'] = TypeParticipant.PHD
                elif t.startswith('sr.'):
                    data['type'] = TypeParticipant.SR
                elif t.startswith('sra.'):
                    data['type'] = TypeParticipant.SRA
                elif t == 'tec.':
                    data['type'] = TypeParticipant.TEC
                elif t == 'tec.sup.':
                    data['type'] = TypeParticipant.TECSUP
                else:
                    skipped_rows.append({'row': row_num, 'reason': 'Tipo inválido'})
                    continue

                participant = None
                if data['identification_number']:
                    participant = Participant.objects.filter(identification_number=data['identification_number']).first()
                if not participant:
                    participant = Participant.objects.filter(email=data['email']).first()

                if participant:
                    updated = False
                    for field in ['first_name','last_name','phone','type','career']:
                        val = data[field]
                        if val and getattr(participant, field) != val:
                            setattr(participant, field, val)
                            updated = True
                    if data['identification_number'] and participant.identification_number != data['identification_number']:
                        participant.identification_number = data['identification_number']
                        updated = True
                    if updated:
                        participant.save()
                        updated_participants += 1
                else:
                    Participant.objects.create(
                        first_name=data['first_name'],
                        last_name=data['last_name'],
                        email=data['email'],
                        phone=data['phone'],
                        identification_number=data['identification_number'],
                        type=data['type'],
                        career=data['career'],
                    )
                    created_participants += 1

                participant = participant or Participant.objects.get(email=data['email'])

                if event:
                    obj, created = Registration.objects.get_or_create(
                        event=event,
                        participant=participant,
                        defaults={
                            'status': StatusRegistration.CONFIRMED,
                            'registered_by': request.user if request.user.is_authenticated else None,
                        }
                    )
                    if created:
                        created_registrations += 1
                    else:
                        # Si la registración ya existía, asegurar que esté confirmada
                        if obj.status != StatusRegistration.CONFIRMED:
                            obj.status = StatusRegistration.CONFIRMED
                            obj.save()
                    
                    # Si se solicita envío de correos, agregar a la lista para procesamiento asíncrono
                    if send_emails and obj.status == StatusRegistration.CONFIRMED and obj.participant.email:
                        registrations_to_email.append(obj.id)

            except Exception as e:
                skipped_rows.append({'row': row_num, 'reason': str(e)})

        # Función para enviar correos en background con delay
        def send_emails_async(registration_ids):
            """Envía correos de forma asíncrona con delay entre cada uno"""
            import logging
            logger = logging.getLogger(__name__)
            
            sent = 0
            failed = 0
            for reg_id in registration_ids:
                try:
                    registration = Registration.objects.select_related('participant', 'event').get(id=reg_id)
                    if registration.status == StatusRegistration.CONFIRMED and registration.participant.email:
                        success, message = send_email_qr_code(registration)
                        if success:
                            sent += 1
                            logger.info(f"Correo enviado exitosamente a {registration.participant.email}")
                        else:
                            failed += 1
                            logger.error(f"Error enviando correo a {registration.participant.email}: {message}")
                    else:
                        logger.warning(f"Registro {reg_id} no cumple condiciones para enviar correo")
                except Exception as e:
                    failed += 1
                    logger.error(f"Excepción al procesar registro {reg_id}: {str(e)}", exc_info=True)
                finally:
                    # Delay de 0.5 segundos entre correos para no sobrecargar SMTP
                    time.sleep(0.5)
            logger.info(f"Proceso de envío de correos completado: {sent} enviados, {failed} fallidos")
        
        # Iniciar envío de correos en background si hay registros para enviar
        if send_emails and registrations_to_email:
            email_thread = threading.Thread(target=send_emails_async, args=(registrations_to_email,))
            email_thread.daemon = True
            email_thread.start()
            # Retornar inmediatamente sin esperar a que terminen los correos
            return Response({
                'created_participants': created_participants,
                'updated_participants': updated_participants,
                'created_registrations': created_registrations if event else 0,
                'emails_queued': len(registrations_to_email),
                'message': 'Excel procesado correctamente. Los correos se están enviando en background.',
                'skipped_rows': skipped_rows,
                'event_id': str(event.id) if event else None,
                'note': f'Para ver el resumen completo de envíos, consulta: /api/registrations/delivery_summary/?event={event.id}' if event else None,
            })
        
        return Response({
            'created_participants': created_participants,
            'updated_participants': updated_participants,
            'created_registrations': created_registrations if event else 0,
            'emails_sent': emails_sent,
            'emails_failed': emails_failed,
            'skipped_rows': skipped_rows,
        })

# --- EVENT CRUD ---
class EventViewSet(viewsets.ModelViewSet):
    permission_classes = [IsInstitutionalUser]
    queryset = Event.objects.all().order_by("-created_at")
    serializer_class = EventSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title"]
    ordering_fields = ["created_at"]

    @action(detail=True, methods=['post'], url_path='close-attendance')
    def close_attendance(self, request, pk=None):
        event = self.get_object()
        if not event.sessions.filter(is_active=True).exists():
            raise APIValidationError('El evento necesita al menos una sesión activa.')
        if not event.attendance_closed_at:
            event.attendance_closed_at = timezone.now()
            event.save(update_fields=['attendance_closed_at'])
        return Response({'attendance_closed_at': event.attendance_closed_at})

    def perform_update(self, serializer):
        if self.get_object().attendance_closed_at:
            raise APIValidationError('La asistencia del evento ya está cerrada.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.attendance_closed_at:
            raise APIValidationError('No se puede eliminar un evento con asistencia cerrada.')
        instance.delete()

# --- EVENT SESSION CRUD ---
class EventSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsInstitutionalUser]
    queryset = EventSession.objects.select_related("event").all().order_by("session_date", "start_time")
    serializer_class = EventSessionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event', 'event__id', 'session_date', 'is_active']
    search_fields = ["event__title", "session_name"]
    ordering_fields = ["created_at", "session_date", "start_time"]

    def perform_create(self, serializer):
        if serializer.validated_data['event'].attendance_closed_at:
            raise APIValidationError('La asistencia del evento ya está cerrada.')
        serializer.save()

    def perform_update(self, serializer):
        if self.get_object().event.attendance_closed_at or serializer.validated_data.get('event', self.get_object().event).attendance_closed_at:
            raise APIValidationError('La asistencia del evento ya está cerrada.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.event.attendance_closed_at:
            raise APIValidationError('La asistencia del evento ya está cerrada.')
        instance.delete()

# --- REGISTRATION CRUD ---
class RegistrationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsInstitutionalUser]
    queryset = Registration.objects.select_related("event", "participant").all().order_by("-registered_at")
    serializer_class = RegistrationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    pagination_class = None  # Desactivar paginación para mostrar todos los registros
    # Permitir filtrar por evento y otros campos relacionados
    filterset_fields = [
        'event',           # /registrations/?event=<event_id>
        'event__id',       # /registrations/?event__id=<event_id>
        'participant',     # /registrations/?participant=<participant_id>
        'status',          # /registrations/?status=Confirmado
    ]
    search_fields = ["participant__first_name", "participant__last_name", "event__title"]
    ordering_fields = ["registered_at"]

    def perform_create(self, serializer):
        if serializer.validated_data['event'].attendance_closed_at:
            raise APIValidationError('La asistencia del evento ya está cerrada.')
        serializer.save()

    def perform_update(self, serializer):
        if self.get_object().event.attendance_closed_at or serializer.validated_data.get('event', self.get_object().event).attendance_closed_at:
            raise APIValidationError('La asistencia del evento ya está cerrada.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.event.attendance_closed_at:
            raise APIValidationError('La asistencia del evento ya está cerrada.')
        instance.delete()

    def create(self, request, *args, **kwargs):
        """Override create to send QR code via email after registration"""
        import logging
        logger = logging.getLogger(__name__)
        
        response = super().create(request, *args, **kwargs)

        # Get the created registration
        registration_id = response.data.get('id')
        registration = Registration.objects.select_related('event', 'participant').get(id=registration_id)

        # Send QR code via email if registration is confirmed and participant has email
        if registration.status == StatusRegistration.CONFIRMED and registration.participant.email:
            try:
                success, message = send_email_qr_code(registration)
                if success:
                    logger.info(f"Correo enviado exitosamente a {registration.participant.email} para registro {registration_id}")
                    response.data['email_sent'] = True
                    response.data['email_message'] = message
                else:
                    logger.error(f"Error enviando correo a {registration.participant.email}: {message}")
                    response.data['email_sent'] = False
                    response.data['email_message'] = message
            except Exception as e:
                # No fallar la creación si el correo falla, pero loguear el error
                error_msg = f"Excepción al enviar correo: {str(e)}"
                logger.error(f"Excepción al enviar correo para registro {registration_id}: {error_msg}", exc_info=True)
                response.data['email_sent'] = False
                response.data['email_message'] = error_msg
        else:
            response.data['email_sent'] = False
            if not registration.participant.email:
                response.data['email_message'] = "Participante no tiene email"
            elif registration.status != StatusRegistration.CONFIRMED:
                response.data['email_message'] = "Registro no está confirmado"

        return response

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def qr_code(self, request, pk=None):
        """
        Generate and return QR code image for a registration
        GET /registrations/{id}/qr_code/

        This endpoint is publicly accessible (no authentication required).
        """
        registration = self.get_object()

        # Generate QR code
        qr_buffer = registration.generate_qr_code(format='PNG')

        # Return as image
        return HttpResponse(qr_buffer.getvalue(), content_type='image/png')

    @action(detail=True, methods=['post'])
    def send_qr_email(self, request, pk=None):
        """
        Manually send QR code via email for an existing registration
        POST /registrations/{id}/send_qr_email/
        """
        registration = self.get_object()
        success, message = send_email_qr_code(registration)
        if success:
            return Response({
                'success': True,
                'message': message
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': message
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='send_qr_emails_bulk')
    def send_qr_emails_bulk(self, request):
        """
        Enviar QR codes por correo a todos los participantes de un evento
        POST /registrations/send_qr_emails_bulk/?event=<event_id>
        
        Controla duplicados: solo envía a participantes que tienen email
        y están confirmados
        """
        event_id = request.query_params.get('event')
        if not event_id:
            return Response(
                {"detail": "Se requiere el parámetro 'event' en la URL"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {"detail": "Evento no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener todas las registraciones confirmadas del evento con email
        registrations = Registration.objects.filter(
            event=event,
            status=StatusRegistration.CONFIRMED,
            participant__email__isnull=False
        ).exclude(participant__email='').select_related('participant', 'event')
        
        sent_count = 0
        failed_count = 0
        failed_details = []
        
        for registration in registrations:
            try:
                success, message = send_email_qr_code(registration)
                if success:
                    sent_count += 1
                else:
                    failed_count += 1
                    failed_details.append({
                        'participant': registration.participant.full_name,
                        'email': registration.participant.email,
                        'error': message
                    })
            except Exception as e:
                failed_count += 1
                failed_details.append({
                    'participant': registration.participant.full_name,
                    'email': registration.participant.email,
                    'error': str(e)
                })
        
        return Response({
            'event_title': event.title,
            'total_registrations': registrations.count(),
            'sent_count': sent_count,
            'failed_count': failed_count,
            'failed_details': failed_details[:10]  # Limitar a 10 errores para no saturar la respuesta
        })

    @action(detail=False, methods=['get'], url_path='delivery_summary')
    def delivery_summary(self, request):
        """
        Obtener resumen de envíos de QRs (email) para un evento
        GET /registrations/delivery_summary/?event=<event_id>
        """
        event_id = request.query_params.get('event')
        if not event_id:
            return Response(
                {"detail": "Se requiere el parámetro 'event' en la URL"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {"detail": "Evento no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener todas las registraciones del evento
        registrations = Registration.objects.filter(event=event).select_related('participant')
        
        # Resumen de emails
        email_logs = EmailDeliveryLog.objects.filter(registration__event=event)
        email_success = email_logs.filter(success=True).count()
        email_failed = email_logs.filter(success=False).count()
        email_failed_details = EmailDeliveryLogSerializer(
            email_logs.filter(success=False).order_by('-sent_at')[:20],
            many=True
        ).data
        
        # Participantes sin email
        participants_without_email = registrations.filter(
            participant__email__isnull=True
        ).exclude(participant__email='').count()
        
        return Response({
            'event': {
                'id': str(event.id),
                'title': event.title
            },
            'total_registrations': registrations.count(),
            'email_summary': {
                'total_sent': email_success,
                'total_failed': email_failed,
                'failed_details': email_failed_details,
                'participants_without_email': participants_without_email
            },
            'overall': {
                'total_participants': registrations.count(),
                'emails_sent': email_success,
                'emails_failed': email_failed
            }
        })

    @action(detail=False, methods=['post'], url_path='resend_failed')
    def resend_failed(self, request):
        """
        Reenviar QRs a participantes que fallaron en el envío
        POST /registrations/resend_failed/?event=<event_id>&type=email
        """
        event_id = request.query_params.get('event')
        send_type = request.query_params.get('type', 'email')

        if send_type != 'email':
            return Response(
                {"detail": "El parámetro 'type' solo admite el valor 'email'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not event_id:
            return Response(
                {"detail": "Se requiere el parámetro 'event' en la URL"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {"detail": "Evento no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        results = {
            'email': {'resent': 0, 'failed': 0, 'details': []}
        }
        
        # Reenviar emails fallidos
        failed_email_logs = EmailDeliveryLog.objects.filter(
            registration__event=event,
            success=False
        ).select_related('registration', 'registration__participant', 'registration__event')

        for log in failed_email_logs:
            try:
                success, message = send_email_qr_code(log.registration, log_delivery=True)
                if success:
                    results['email']['resent'] += 1
                    results['email']['details'].append({
                        'participant': log.participant_name,
                        'email': log.participant_email,
                        'status': 'success',
                        'message': message
                    })
                else:
                    results['email']['failed'] += 1
                    results['email']['details'].append({
                        'participant': log.participant_name,
                        'email': log.participant_email,
                        'status': 'failed',
                        'message': message
                    })
            except Exception as e:
                results['email']['failed'] += 1
                results['email']['details'].append({
                    'participant': log.participant_name,
                    'email': log.participant_email,
                    'status': 'error',
                    'message': str(e)
                })
        
        return Response({
            'event': {
                'id': str(event.id),
                'title': event.title
            },
            'send_type': send_type,
            'results': results,
            'summary': {
                'total_emails_resent': results['email']['resent'],
                'total_emails_failed': results['email']['failed']
            }
        })

# --- ATTENDANCE CRUD ---
class AttendanceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsInstitutionalUser]
    queryset = Attendance.objects.select_related("registration__participant", "session").all().order_by("-checked_in_at")
    serializer_class = AttendanceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['session', 'registration', 'registration__participant']
    search_fields = ["registration__participant__first_name", "registration__participant__last_name", "session__event__title"]
    ordering_fields = ["checked_in_at"]

    def perform_create(self, serializer):
        registration = serializer.validated_data['registration']
        session = serializer.validated_data['session']
        if registration.event_id != session.event_id:
            raise APIValidationError('La sesión no pertenece al evento del participante.')
        if registration.event.attendance_closed_at:
            raise APIValidationError('La asistencia del evento ya está cerrada.')
        serializer.save()

    def perform_update(self, serializer):
        if self.get_object().registration.event.attendance_closed_at:
            raise APIValidationError('La asistencia del evento ya está cerrada.')
        if serializer.validated_data.get('registration', self.get_object().registration).event.attendance_closed_at:
            raise APIValidationError('La asistencia del evento ya está cerrada.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.registration.event.attendance_closed_at:
            raise APIValidationError('La asistencia del evento ya está cerrada.')
        instance.delete()
    
    @action(detail=False, methods=['get'], url_path='by_event/(?P<event_id>[^/.]+)')
    def by_event(self, request, event_id=None):
        """
        Endpoint optimizado para obtener TODAS las asistencias de un evento
        Sin paginación - optimizado para 300+ participantes
        GET /attendances/by_event/{event_id}/
        """
        try:
            # Obtener todas las asistencias del evento con una sola query optimizada
            attendances = Attendance.objects.filter(
                session__event_id=event_id
            ).select_related(
                'registration__participant',
                'session'
            ).order_by('session__session_date', 'session__start_time', 'checked_in_at')
            
            # Serializar sin paginación
            serializer = self.get_serializer(attendances, many=True)
            
            return Response({
                'count': attendances.count(),
                'attendances': serializer.data
            })
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def checkin(self, request):
        """
        Endpoint para registrar asistencia mediante código QR
        Espera: registration_code, session_id, location?, notes?
        """
        registration_code = request.data.get('registration_code')
        session_id = request.data.get('session_id')
        location = request.data.get('location', '')
        notes = request.data.get('notes', '')

        if not registration_code or not session_id:
            return Response(
                {'detail': 'registration_code y session_id son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if EventSession.objects.filter(id=session_id, event__attendance_closed_at__isnull=False).exists():
            raise APIValidationError('La asistencia del evento ya está cerrada.')

        # Usa el método de modelo centralizado
        attendance, created, error = Attendance.check_in(
            registration_code=registration_code,
            session_id=session_id,
            checked_in_by=request.user if request.user.is_authenticated else None,
            location=location,
            notes=notes
        )

        if error:
            return Response({'detail': error}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(attendance)
        return Response({
            'message': 'Check-in exitoso' if created else 'Ya estaba registrado',
            'created': created,
            'attendance': serializer.data
        })

# --- CERTIFICATE CRUD ---
class CertificateViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [CertificateAccessPermission]
    queryset = Certificate.objects.select_related("registration__participant", "registration__event").all().order_by("-issued_at")
    serializer_class = CertificateSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['registration__event']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated and self.request.user.user_type == 'member':
            return queryset.filter(
                recipient_email__iexact=self.request.user.email,
                is_active=True,
            )
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[IsInstitutionalUser])
    def eligible(self, request):
        event_id = request.query_params.get('event')
        if not event_id:
            raise APIValidationError('Selecciona un evento.')
        try:
            event = get_object_or_404(Event, id=uuid.UUID(event_id))
        except (ValueError, TypeError):
            raise APIValidationError('El identificador del evento no es válido.')
        registrations = Registration.objects.filter(
            event=event, status=StatusRegistration.CONFIRMED,
        ).select_related('participant').order_by('participant__last_name')
        results = []
        for registration in registrations:
            if registration.is_eligible_for_certificate and not registration.has_certificate:
                results.append({
                    'registration_id': registration.id,
                    'participant_name': registration.participant.full_name,
                    'participant_email': registration.participant.email,
                    'attended_sessions': registration.attended_sessions_count,
                    'total_sessions': registration.total_event_sessions,
                })
        return Response({'attendance_closed_at': event.attendance_closed_at, 'results': results})

    @action(detail=False, methods=['post'], permission_classes=[IsInstitutionalUser])
    def issue(self, request):
        registration_id = request.data.get('registration_id')
        if not registration_id:
            raise APIValidationError('Selecciona un participante elegible.')
        try:
            registration_id = uuid.UUID(str(registration_id))
        except (ValueError, TypeError):
            raise APIValidationError('El identificador del participante no es válido.')
        with transaction.atomic():
            registration = get_object_or_404(
                Registration.objects.select_related('event', 'participant'), id=registration_id,
            )
            event = Event.objects.select_for_update().get(pk=registration.event_id)
            if not event.attendance_closed_at:
                raise APIValidationError('Cierra la asistencia antes de emitir certificados.')
            if not registration.is_eligible_for_certificate:
                raise APIValidationError('El participante debe asistir a más del 50 % de las sesiones.')
            if registration.has_certificate:
                raise APIValidationError('El certificado ya fue emitido.')
            certificate, created, error = Certificate.issue_certificate(registration, issued_by=request.user)
            if not created:
                raise APIValidationError(error)
            def notify_recipient():
                try:
                    send_mail(
                        'Tu certificado está disponible en VRIS',
                        f"Se emitió tu certificado de {certificate.snapshot['event_title']}. "
                        f"Accede con {certificate.recipient_email} a {settings.FRONTEND_URL.rstrip('/')}/my-certificates. "
                        f"Si aún no tienes cuenta, regístrate con ese mismo correo en {settings.FRONTEND_URL.rstrip('/')}/auth/sign-up.",
                        settings.DEFAULT_FROM_EMAIL, [certificate.recipient_email],
                    )
                except Exception:
                    logging.getLogger(__name__).exception('No se pudo enviar el aviso de certificado %s', certificate.id)
            transaction.on_commit(notify_recipient)
        return Response(self.get_serializer(certificate).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mint(self, request, pk=None):
        if request.user.user_type != 'member':
            raise APIValidationError('Solo el titular puede vincular su certificado a una billetera.')
        certificate = self.get_object()
        if not request.user.wallet_address:
            raise APIValidationError('Vincula una billetera antes de registrar el certificado en Sepolia.')
        if not certificate.content_hash:
            raise APIValidationError('Este certificado anterior no tiene datos congelados para blockchain.')
        if certificate.blockchain_status not in ('pending_wallet', 'failed'):
            raise APIValidationError('El certificado ya tiene una transacción. Consulta su estado.')
        try:
            submit_certificate(certificate, request.user.wallet_address)
        except APIValidationError:
            raise
        except Exception:
            if certificate.transaction_hash:
                raise APIValidationError('No se pudo confirmar el envío. Consulta la transacción antes de reintentar.')
            raise APIValidationError('La red de prueba no está disponible. Inténtalo más tarde.')
        return Response(self.get_serializer(certificate).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def sync(self, request, pk=None):
        certificate = self.get_object()
        if not certificate.transaction_hash:
            raise APIValidationError('Este certificado aún no tiene transacción.')
        try:
            sync_certificate(certificate)
        except TransactionNotFound:
            pass
        except APIValidationError:
            raise
        except Exception:
            raise APIValidationError('No se pudo consultar la transacción en blockchain.')
        return Response(self.get_serializer(certificate).data)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def metadata(self, request, pk=None):
        certificate = get_object_or_404(Certificate, id=pk, is_active=True, blockchain_status='confirmed')
        snapshot = certificate.snapshot
        return Response({
            'name': f"{snapshot['event_title']} · {snapshot['participant_name']}",
            'description': 'Certificado de participación intransferible emitido por VRIS.',
            'external_url': f"{settings.FRONTEND_URL.rstrip('/')}/verify/{certificate.certificate_code}",
            'attributes': [{'trait_type': 'Código', 'value': str(certificate.certificate_code)}],
        })


class VerifyCertificateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, code):
        certificate = get_object_or_404(Certificate, certificate_code=code, is_active=True)
        verified = False
        if certificate.blockchain_status == 'confirmed':
            try:
                verified = verify_certificate(certificate)
            except Exception:
                return Response({'verified': False, 'detail': 'No se pudo consultar la red blockchain.'}, status=503)
        return Response({
            'verified': verified,
            'status': certificate.blockchain_status,
            'participant_name': certificate.snapshot.get('participant_name'),
            'event_title': certificate.snapshot.get('event_title'),
            'issued_at': certificate.snapshot.get('issued_at'),
            'chain_id': certificate.chain_id,
            'contract_address': certificate.contract_address,
            'transaction_hash': certificate.transaction_hash,
            'token_id': certificate.token_id,
        })

## PreRegistrationViewSet eliminado


