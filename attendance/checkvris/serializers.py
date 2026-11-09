from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from checkvris.models import User, PasswordResetCode, Event, EventSession, Participant, Registration, Attendance, Certificate, EmailDeliveryLog


class PublicSignUpSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100, trim_whitespace=True)
    last_name = serializers.CharField(max_length=100, trim_whitespace=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('Ya existe una cuenta con este correo.')
        return email

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            **validated_data,
            user_type='member',
            is_active=False,
            is_staff=False,
        )

# --- LOGIN SERIALIZER ---
class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user_data = User.objects.get(email=data['email'])
        except:
            raise serializers.ValidationError("No existe esa Cuenta")

        if not user_data.is_active:
            raise serializers.ValidationError("Cuenta inactiva")

        user = authenticate(email=data['email'], password=data['password'])

        if not user:
            raise serializers.ValidationError("Credenciales incorrectas")
        
        refresh = RefreshToken.for_user(user)


        return {
                'refresh': str(refresh),
                'token': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'user_type': user.user_type,
                    'email': user.email,
                    'name': f'{user.first_name} {user.last_name}',
                    'is_staff': user.is_staff,
                }
            }

class EmailActivationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    activation_code = serializers.CharField(max_length=6)

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError("No existe una cuenta con este email.")

        if user.is_active:
            raise serializers.ValidationError("Esta cuenta ya está activada.")

        # Check if activation code exists and is valid
        try:
            activation_code = PasswordResetCode.objects.get(
                user=user,
                code=data['activation_code']
            )
            if not activation_code.is_valid():
                raise serializers.ValidationError("El código de activación ha expirado.")
        except PasswordResetCode.DoesNotExist:
            raise serializers.ValidationError("Código de activación inválido.")

        return data

# --- USER SERIALIZERS ---
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", 
            "first_name", "last_name", 
            "user_type", "phone",
            "is_active", "is_staff", "date_joined"
        ]
        read_only_fields = ["date_joined"]

class UserListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'email']
    def get_name(self, obj):
        """Concatena first_name y last_name en un solo campo name."""
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def get_email(self, obj):
        """Concatena first_name y last_name en un solo campo name."""
        return f"{obj.email}"
    

# --- PARTICIPANT ---
class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = ["id", "first_name", "last_name", 
                  "email", "phone", "identification_number", 
                  "type", "career"]


# --- EVENT ---
class EventSerializer(serializers.ModelSerializer):
    created_by = UserListSerializer(read_only=True)
    
    class Meta:
        model = Event
        fields = ["id", "title", "description",
                  "start_date", "end_date", 
                  "location", "capacity", "status", 
                  "registration_deadline", "start_date", "end_date", 
                  "created_at", "requires_attendance_for_certificate", "minimum_attendance_percentage",
                  "created_by", "created_by_id"]
        read_only_fields = ["created_by", "created_at"]


    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["created_by"] = request.user
        return super().create(validated_data)

# --- EVENT SESSION ---
class EventSessionSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)
    event_id = serializers.PrimaryKeyRelatedField(
        queryset=Event.objects.all(), source="event", write_only=True
    )

    class Meta:
        model = EventSession
        fields = [
            "id", "event", "event_id", "session_date",
            "start_time", "end_time", "session_name", "created_at"
        ]


# --- REGISTRATION ---
class RegistrationSerializer(serializers.ModelSerializer):
    participant = ParticipantSerializer(read_only=True)
    participant_id = serializers.PrimaryKeyRelatedField(
        queryset=Participant.objects.all(), source="participant", write_only=True
    )
    event = EventSerializer(read_only=True)
    event_id = serializers.PrimaryKeyRelatedField(
        queryset=Event.objects.all(), source="event", write_only=True
    )

    class Meta:
        model = Registration
        fields = [
            "id", "participant", "participant_id", "event", "event_id",
            "registration_code", "status", "notes", "registered_by"
        ]
        read_only_fields = ["registration_code", "registered_by"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["registered_by"] = request.user
        return super().create(validated_data)

# --- ATTENDANCE ---
class AttendanceSerializer(serializers.ModelSerializer):
    registration = RegistrationSerializer(read_only=True)
    registration_id = serializers.PrimaryKeyRelatedField(
        queryset=Registration.objects.all(), source="registration", write_only=True
    )
    session = EventSessionSerializer(read_only=True)
    session_id = serializers.PrimaryKeyRelatedField(
        queryset=EventSession.objects.all(), source="session", write_only=True
    )
    checked_in_by = UserSerializer(read_only=True)
    checked_in_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="checked_in_by", write_only=True
    )


    class Meta:
        model = Attendance
        fields = [
            "id", "registration", "registration_id", "session",
            "session_id", "checked_in_by", "checked_in_by_id", "location", "notes", "checked_in_at"
        ]


# --- CERTIFICATE ---
class CertificateSerializer(serializers.ModelSerializer):
    registration = RegistrationSerializer(read_only=True)
    registration_id = serializers.PrimaryKeyRelatedField(
        queryset=Registration.objects.all(), source="registration", write_only=True
    )

    issued_by = UserListSerializer(read_only=True)
    issued_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="issued_by", write_only=True
    )

    class Meta:
        model = Certificate
        fields = [
            "id", "registration", "registration_id",
            "issued_by", "issued_by_id", "certificate_code", "issued_at", "is_active"
        ]
        read_only_fields = ["certificate_code", "issued_at", "is_active"]

## PreRegistrationSerializer eliminado

# --- DELIVERY LOGS ---
class EmailDeliveryLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailDeliveryLog
        fields = [
            "id", "registration", "participant_email", "participant_name",
            "event_title", "success", "error_message", "sent_at",
            "retry_count", "last_retry_at"
        ]
        read_only_fields = ["id", "sent_at"]
