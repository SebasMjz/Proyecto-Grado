from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.core.exceptions import ValidationError
import uuid
import qrcode
from io import BytesIO


class TypeParticipant(models.TextChoices):
    STUDENT = 'Estudiante', 'Estudiante'
    PROFESSIONAL = 'Profesional', 'Profesional'
    ARQ = 'Arq.', 'Arq'
    DR = 'Dr.', 'Dr.'
    DRA = 'Dra.', 'Dra.'
    ING = 'Ing.', 'Ing.'
    INGMSC = 'Ing.M.Sc.', 'Ing.M.Sc.'
    LIC = 'Lic.', 'Lic.'
    LICMSC = 'Lic.M.Sc.', 'Lic.M.Sc.'
    PHD = 'Ph.D.', 'Ph.D.'
    SR = 'Sr.', 'Sr.'
    SRA = 'Sra.', 'Sra.'
    TEC = 'Tec.', 'Tec.'
    TECSUP = 'Tec.Sup.', 'Tec.Sup.'

class UserType(models.TextChoices):
    PERSONAL = 'Personal', 'Personal'
    STUDENT = 'Estudiante', 'Estudiante'
    ADMIN = 'Admin', 'Admin'

class StatusRegistration(models.TextChoices):
    PENDING = 'Pendiente', 'Pendiente'
    CONFIRMED = 'Confirmado', 'Confirmado'
    CANCELLED = 'Cancelado', 'Cancelado'

class StatusEvent(models.TextChoices):
    DRAFT = 'Borrador', 'Borrador'
    PUBLISHED = 'Publicado', 'Publicado'
    CANCELLED = 'Cancelado', 'Cancelado',
    COMPLETED = 'Completado', 'Completado'

class UserManager(BaseUserManager):
    """Custom manager for User model"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user"""
        if not email:
            raise ValueError('Users must have an email address')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model using email as the unique identifier"""
    
    USER_TYPE_CHOICES = [
        ('admin', 'Administrator'),
        ('vicerrectora', 'Vicerectora'),
        ('director_nacional', 'Director Nacional'),
        ('staff', 'Personal'),
        ('member', 'Usuario registrado'),
    ]
    
    email = models.EmailField(unique=True, max_length=255)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='staff')
    phone = models.CharField(max_length=20, blank=True)
    
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    
    date_joined = models.DateTimeField(auto_now_add=True)

    reset_token = models.UUIDField(default=uuid.uuid4, null=True, blank=True)
    reset_token_created_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        """Return the full name of the user"""
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        """Return the short name (first name) of the user"""
        return self.first_name

    def generate_reset_token(self):
        self.reset_token = uuid.uuid4()
        self.reset_token_created_at = timezone.now()
        self.save()

    def is_reset_token_valid(self):
        if not self.reset_token_created_at:
            return False
        return timezone.now() - self.reset_token_created_at < timedelta(hours=1)

    @property
    def full_name(self):
        return self.get_full_name()


class Participant(models.Model):
    """Model for event participants (no user account required)"""
    id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    identification_number = models.CharField(max_length=50, blank=True, help_text="ID card, passport, or similar")
    type = models.CharField(max_length=20, choices=TypeParticipant.choices, default=TypeParticipant.STUDENT)
    career = models.CharField(max_length=100, null=True, blank=True, help_text="Field of study or profession")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['last_name', 'first_name']
        
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Event(models.Model):
    """Model for managing events (can have multiple sessions)"""

    id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=300)
    capacity = models.IntegerField(help_text="Maximum number of participants", null=True, blank=True)
    status = models.CharField(max_length=20, choices=StatusEvent.choices, default=StatusEvent.DRAFT)
    registration_deadline = models.DateTimeField(null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    # Certificate settings
    requires_attendance_for_certificate = models.BooleanField(
        default=False,
        help_text="If True, participant must attend all sessions to receive certificate"
    )
    minimum_attendance_percentage = models.IntegerField(
        default=0,
        help_text="Minimum attendance percentage required (0-100). 0 means no requirement."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return self.title
    
    @property
    def is_registration_open(self):
        """Check if registration is still open"""
        if self.status != StatusEvent.PUBLISHED:
            return False
        if self.registration_deadline and timezone.now() > self.registration_deadline:
            return False
        return self.registered_count < self.capacity
    
    @property
    def total_sessions(self):
        """Get total number of sessions for this event"""
        return self.sessions.count()
    
    @property
    def registered_count(self):
        """Get total number of confirmed registrations"""
        return self.registrations.filter(status=StatusRegistration.CONFIRMED).count()


class EventSession(models.Model):
    """Model for individual sessions of an event (date and time)"""
    id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, primary_key=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='sessions')
    session_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    session_name = models.CharField(max_length=100, blank=True, help_text="e.g., 'Morning Session', 'Afternoon Session'")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['session_date', 'start_time']
        unique_together = ['event', 'session_date', 'start_time']
        
    def __str__(self):
        session_label = self.session_name or f"{self.start_time.strftime('%H:%M')}"
        return f"{self.event.title} - {self.session_date} {session_label}"
    
    def clean(self):
        """Validate that end_time is after start_time"""
        if self.end_time <= self.start_time:
            raise ValidationError('End time must be after start time')
    
        if self.session_date < self.event.start_date:
            raise ValidationError("La fecha de la sesión no puede ser anterior al evento.")
        
        if self.session_date > self.event.end_date:
            raise ValidationError("La fecha de la sesión no puede ser despues al evento.")
    
    @property
    def attendance_count(self):
        """Get number of participants who checked in to this session"""
        return self.attendances.count()
    
    @property
    def datetime_start(self):
        """Get combined datetime for session start"""
        return timezone.make_aware(
            timezone.datetime.combine(self.session_date, self.start_time)
        )


class Registration(models.Model):
    """Model for participant registration to an event (ONE registration per participant per event)"""
    id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, primary_key=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='registrations')
    registration_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    status = models.CharField(max_length=20, choices=StatusRegistration.choices, default=StatusRegistration.PENDING)
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, help_text="Additional notes or requirements")
    registered_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name='registrations')

    class Meta:
        unique_together = ['event', 'participant']
        ordering = ['-registered_at']
        
    def __str__(self):
        return f"{self.participant.full_name} - {self.event.title}"
    
    def generate_qr_code(self, format='PNG'):
        """
        Generate QR code on-the-fly (no storage needed)
        The same QR code is used for all sessions of this event
        Returns: BytesIO buffer containing the QR code image
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        # The QR code contains the unique registration code
        qr_data = str(self.registration_code)
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Return image in buffer (no file storage)
        buffer = BytesIO()
        img.save(buffer, format=format)
        buffer.seek(0)
        return buffer
    
    def get_qr_code_url(self):
        """Get URL to dynamically generate QR code"""
        return f"/qr-codes/{self.registration_code}/"
    
    @property
    def attended_sessions_count(self):
        """Get number of sessions attended"""
        return self.attendances.count()
    
    @property
    def total_event_sessions(self):
        """Get total number of sessions in the event"""
        return self.event.sessions.filter(is_active=True).count()
    
    @property
    def is_eligible_for_certificate(self):
        """
        Check if participant is eligible for certificate based on event settings
        """
        if self.status != 'confirmed':
            return False
        
        # Check event-specific requirements
        event = self.event
        
        # If event requires attendance
        if event.requires_attendance_for_certificate:
            total_sessions = self.total_event_sessions
            attended_sessions = self.attended_sessions_count
            
            if total_sessions == 0:
                return False
            
            # Check if minimum percentage is met
            if event.minimum_attendance_percentage > 0:
                attendance_percentage = (attended_sessions / total_sessions) * 100
                return attendance_percentage >= event.minimum_attendance_percentage
            else:
                # Requires all sessions
                return attended_sessions == total_sessions
        
        # No attendance requirement - all confirmed registrations are eligible
        return True
    
    @property
    def has_certificate(self):
        """Check if certificate has been issued"""
        return hasattr(self, 'certificate') and self.certificate is not None
    
    def get_attendance_status(self):
        """
        Get detailed attendance status for all sessions
        Returns list of dicts with session and attendance info
        """
        sessions = self.event.sessions.filter(is_active=True).order_by('session_date', 'start_time')
        attendance_dict = {att.session_id: att for att in self.attendances.all()}
        
        status = []
        for session in sessions:
            status.append({
                'session': session,
                'attended': session.id in attendance_dict,
                'attendance': attendance_dict.get(session.id),
            })
        return status


class Attendance(models.Model):
    """Model for recording attendance at specific event sessions"""
    id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, primary_key=True)
    registration = models.ForeignKey(
        Registration,
        on_delete=models.CASCADE,
        related_name='attendances'
    )
    session = models.ForeignKey(
        EventSession,
        on_delete=models.CASCADE,
        related_name='attendances'
    )
    checked_in_at = models.DateTimeField(auto_now_add=True)
    checked_in_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='checked_in_attendances',
        help_text="Staff member who processed the check-in"
    )
    location = models.CharField(max_length=200, blank=True, help_text="Check-in location/gate")
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-checked_in_at']
        unique_together = ['registration', 'session']
        verbose_name_plural = 'Attendances'
        
    def __str__(self):
        return f"{self.registration.participant.full_name} - {self.session} - {self.checked_in_at}"
    
    @classmethod
    def check_in(cls, registration_code, session_id, checked_in_by=None, location='', notes=''):
        """
        Check in a participant to a specific session using their registration code
        Returns tuple: (attendance_object, created, error_message)
        """
        try:
            # Get registration
            registration = Registration.objects.select_related(
                'event', 'participant'
            ).get(
                registration_code=registration_code,
                status=StatusRegistration.CONFIRMED
            )
            
            # Get session and validate it belongs to the same event
            session = EventSession.objects.get(
                id=session_id,
                event=registration.event,
                is_active=True
            )
            
            # Check if already checked in to this session
            existing_attendance = cls.objects.filter(
                registration=registration,
                session=session
            ).first()
            
            if existing_attendance:
                return (existing_attendance, False, "Already checked in to this session")
            
            # Optional: Check if session has started
            # if session.datetime_start > timezone.now():
            #     return (None, False, "Session has not started yet")
            
            # Create attendance record
            attendance = cls.objects.create(
                registration=registration,
                session=session,
                checked_in_by=checked_in_by,
                location=location,
                notes=notes
            )
            
            return (attendance, True, None)
            
        except Registration.DoesNotExist:
            return (None, False, "Invalid registration code or registration not confirmed")
        except EventSession.DoesNotExist:
            return (None, False, "Session not found or not active")
        except Exception as e:
            return (None, False, str(e))


class Certificate(models.Model):
    """Model for virtual certificates issued to participants"""
    id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, primary_key=True)
    registration = models.OneToOneField(
        Registration,
        on_delete=models.CASCADE,
        related_name='certificate'
    )
    certificate_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    issued_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='issued_certificates'
    )
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-issued_at']
        
    def __str__(self):
        return f"Certificate - {self.registration.participant.full_name} - {self.registration.event.title}"
    
    @property
    def verification_url(self):
        """Generate URL to view/verify certificate"""
        return f"/certificates/{self.certificate_code}/"
    
    @classmethod
    def can_issue_certificate(cls, registration):
        """
        Check if a registration is eligible for a certificate
        Checks registration status and event-specific requirements
        Returns tuple: (eligible: bool, message: str)
        """
        if registration.status != 'confirmed':
            return (False, "Registration is not confirmed")
        
        event = registration.event
        
        # Check if event requires attendance
        if event.requires_attendance_for_certificate:
            total_sessions = registration.total_event_sessions
            attended_sessions = registration.attended_sessions_count
            
            if total_sessions == 0:
                return (False, "Event has no sessions")
            
            # Check minimum percentage requirement
            if event.minimum_attendance_percentage > 0:
                attendance_percentage = (attended_sessions / total_sessions) * 100
                if attendance_percentage < event.minimum_attendance_percentage:
                    return (False, f"Minimum attendance not met. Attended: {attended_sessions}/{total_sessions} ({attendance_percentage:.1f}%). Required: {event.minimum_attendance_percentage}%")
            else:
                # Requires all sessions
                if attended_sessions < total_sessions:
                    return (False, f"Must attend all sessions. Attended: {attended_sessions}/{total_sessions}")
        
        return (True, "Eligible for certificate")
    
    @classmethod
    def issue_certificate(cls, registration, issued_by=None):
        """
        Issue a certificate if eligible
        Returns tuple: (certificate_object, created, error_message)
        """
        # Check if certificate already exists
        if hasattr(registration, 'certificate'):
            return (registration.certificate, False, "Certificate already issued")
        
        # Check eligibility
        eligible, message = cls.can_issue_certificate(registration)
        
        if not eligible:
            return (None, False, message)
        
        # Create certificate
        certificate = cls.objects.create(
            registration=registration,
            issued_by=issued_by
        )
        
        return (certificate, True, None)
    
    def get_certificate_data(self):
        """
        Get data for certificate display
        Returns dictionary with all certificate information
        """
        attendance_details = []
        for attendance in self.registration.attendances.select_related('session').order_by('session__session_date', 'session__start_time'):
            attendance_details.append({
                'session': attendance.session,
                'attended_at': attendance.checked_in_at
            })
        
        return {
            'participant_name': self.registration.participant.full_name,
            'participant_email': self.registration.participant.email,
            'event_title': self.registration.event.title,
            'event_description': self.registration.event.description,
            'event_location': self.registration.event.location,
            'sessions': attendance_details,
            'total_sessions': len(attendance_details),
            'certificate_code': str(self.certificate_code),
            'issued_at': self.issued_at,
            'organizer': self.registration.event.organizer.full_name,
        }


class EventCategory(models.Model):
    """Optional: Categories for organizing events"""
    id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name_plural = 'Event Categories'
        
    def __str__(self):
        return self.name


# Add this field to Event model if you want categories:
# category = models.ForeignKey(EventCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')

class PasswordResetCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reset_codes")
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        """El código es válido por 10 minutos."""
        return timezone.now() - self.created_at < timedelta(minutes=10)

## PreRegistration eliminado por simplificación del flujo


class EmailDeliveryLog(models.Model):
    """Registro de envíos de QR por correo electrónico"""
    id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, primary_key=True)
    registration = models.ForeignKey(Registration, on_delete=models.CASCADE, related_name='email_delivery_logs')
    participant_email = models.EmailField()
    participant_name = models.CharField(max_length=255)
    event_title = models.CharField(max_length=255)
    success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    retry_count = models.IntegerField(default=0)
    last_retry_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-sent_at']
        indexes = [
            models.Index(fields=['registration', 'success']),
            models.Index(fields=['participant_email']),
        ]
    
    def __str__(self):
        status = "✓" if self.success else "✗"
        return f"{status} {self.participant_email} - {self.event_title}"
