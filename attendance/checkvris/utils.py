import random
import os
from datetime import timedelta, datetime
from django.core.mail import EmailMultiAlternatives
from email.mime.image import MIMEImage
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings
from checkvris.models import EmailDeliveryLog


def send_email_password_reset(user, url):

    html_content = render_to_string('emails/reset_password.html', {
        'user_name': f'{user.first_name} {user.last_name}',
        'reset_link': url,
        'site_name': 'VRIS ATTENDANCE',
        'current_year': datetime.now().year
    })
    text_content = f'Tu código de activación es: {url}'
    subject = "Restablece tu contraseña"
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [user.email]
    msg = EmailMultiAlternatives(subject, text_content, from_email, to)
    msg.attach_alternative(html_content, "text/html")
    msg.send()


def generate_activation_code():
    """Generate a 6-digit activation code"""
    return str(random.randint(100000, 999999))


def send_email_activation(user, activation_code):
    """Send activation email with 6-digit code"""

    html_content = render_to_string('emails/activation.html', {
        'user_name': f'{user.first_name} {user.last_name}',
        'activation_code': activation_code,
        'site_name': 'VRIS ATTENDANCE',
        'current_year': datetime.now().year
    })

    text_content = f'''
    Hola {user.first_name},

    Gracias por registrarte en VRIS ATTENDANCE.

    Tu código de activación es: {activation_code}

    Este código expira en 10 minutos.

    Saludos,
    El equipo de UProyecto
    '''

    subject = "Activa tu cuenta - UProyecto"
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [user.email]
    msg = EmailMultiAlternatives(subject, text_content, from_email, to)
    msg.attach_alternative(html_content, "text/html")
    msg.send()


def send_email_qr_code(registration, log_delivery=True):
    """
    Send QR code via email to participant and log the result
    
    Args:
        registration: Registration object with participant and QR code info
        log_delivery: Whether to log the delivery attempt (default: True)
    
    Returns:
        tuple: (success: bool, message: str)
    """
    participant = registration.participant
    event = registration.event
    error_msg = None
    success = False
    
    try:
        if not participant.email:
            error_msg = "Participant has no email address"
            if log_delivery:
                EmailDeliveryLog.objects.create(
                    registration=registration,
                    participant_email='',
                    participant_name=participant.full_name,
                    event_title=event.title,
                    success=False,
                    error_message=error_msg
                )
            return (False, error_msg)
        
        # Generate QR code - Verificar que Pillow funcione
        try:
            qr_buffer = registration.generate_qr_code(format='PNG')
            qr_buffer.seek(0)
        except ImportError as e:
            error_msg = f"Pillow no está instalado correctamente: {str(e)}"
            if log_delivery:
                EmailDeliveryLog.objects.create(
                    registration=registration,
                    participant_email=participant.email,
                    participant_name=participant.full_name,
                    event_title=event.title,
                    success=False,
                    error_message=error_msg
                )
            return (False, error_msg)
        except Exception as e:
            error_msg = f"Error generando QR code: {str(e)}"
            if log_delivery:
                EmailDeliveryLog.objects.create(
                    registration=registration,
                    participant_email=participant.email,
                    participant_name=participant.full_name,
                    event_title=event.title,
                    success=False,
                    error_message=error_msg
                )
            return (False, error_msg)
        
        # Render HTML email template
        html_content = render_to_string('emails/qr_code.html', {
            'participant_name': participant.first_name,
            'event_title': event.title,
            'event_location': event.location,
            'event_start_date': event.start_date.strftime('%d/%m/%Y'),
            'event_end_date': event.end_date.strftime('%d/%m/%Y'),
            'registration_code': str(registration.registration_code),
            'site_name': 'Dapp de Asistencia',
            'current_year': datetime.now().year
        })
        
        text_content = f'''
        Hola {participant.first_name},
        
        Tu registro al evento "{event.title}" ha sido confirmado.
        
        Código de registro: {registration.registration_code}
        
        Por favor, presenta este código QR al ingresar a cada sesión del evento.
        
        Ubicación: {event.location}
        Fechas: {event.start_date.strftime('%d/%m/%Y')} - {event.end_date.strftime('%d/%m/%Y')}
        
        Saludos,
        Dapp de Asistencia
        '''
        
        subject = f"Tu código QR para {event.title} - Dapp de Asistencia"
        from_email = settings.DEFAULT_FROM_EMAIL
        to = [participant.email]
        
        msg = EmailMultiAlternatives(subject, text_content, from_email, to)
        msg.attach_alternative(html_content, "text/html")
        
        # Attach VRIS logo as embedded image (CID) - usando LOGO_VRIS_ONLY para mejor calidad
        logo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'images', 'LOGO_VRIS_ONLY.png')
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as logo_file:
                logo_img = MIMEImage(logo_file.read())
                logo_img.add_header('Content-ID', '<logo_vris>')
                logo_img.add_header('Content-Disposition', 'inline', filename='logo_vris.png')
                msg.attach(logo_img)
        
        # Attach QR code image
        qr_buffer.seek(0)
        msg.attach('qr_code.png', qr_buffer.read(), 'image/png')
        
        msg.send()
        success = True
        message = "QR code email sent successfully"
        
        # Log successful delivery
        if log_delivery:
            EmailDeliveryLog.objects.create(
                registration=registration,
                participant_email=participant.email,
                participant_name=participant.full_name,
                event_title=event.title,
                success=True,
                error_message=None
            )
        
        return (True, message)
        
    except Exception as e:
        error_msg = f"Error sending QR code email: {str(e)}"
        if log_delivery:
            EmailDeliveryLog.objects.create(
                registration=registration,
                participant_email=participant.email if participant.email else '',
                participant_name=participant.full_name,
                event_title=event.title,
                success=False,
                error_message=error_msg
            )
        return (False, error_msg)
