from datetime import date

from django.core import mail
from django.test import override_settings
from rest_framework.test import APITestCase

from checkvris.models import Certificate, Event, Participant, PasswordResetCode, Registration, User


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class PublicAccountTests(APITestCase):
    def test_public_signup_activation_and_certificate_isolation(self):
        response = self.client.post('/attendance/sign-up/', {
            'first_name': 'Ana',
            'last_name': 'Pérez',
            'email': 'ana@example.com',
            'password': 'UnaClaveSegura2026!',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        member = User.objects.get(email='ana@example.com')
        self.assertEqual(member.user_type, 'member')
        self.assertFalse(member.is_staff)
        self.assertFalse(member.is_active)
        self.assertEqual(len(mail.outbox), 1)

        code = PasswordResetCode.objects.get(user=member).code
        activation = self.client.post('/attendance/activate-account/', {
            'email': member.email,
            'activation_code': code,
        }, format='json')
        self.assertEqual(activation.status_code, 200)
        login = self.client.post('/attendance/login/', {
            'email': member.email,
            'password': 'UnaClaveSegura2026!',
        }, format='json')
        self.assertEqual(login.status_code, 200)
        refreshed = self.client.post('/attendance/token/refresh/', {
            'refresh': login.data['refresh'],
        }, format='json')
        self.assertEqual(refreshed.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['token']}")
        current_user = self.client.get('/attendance/me/')
        self.assertEqual(current_user.status_code, 200)
        self.assertEqual(current_user.data['user_type'], 'member')

        issuer = User.objects.create_user(
            email='issuer@example.com', password='OtraClaveSegura2026!',
            first_name='Emisor', last_name='Prueba', user_type='staff', is_active=True,
        )
        event = Event.objects.create(
            title='Seminario', description='Evento de prueba', location='Campus',
            start_date=date(2026, 11, 1), end_date=date(2026, 11, 1), created_by=issuer,
        )
        own_participant = Participant.objects.create(
            first_name='Ana', last_name='Pérez', email='ana@example.com',
        )
        other_participant = Participant.objects.create(
            first_name='Otra', last_name='Persona', email='otra@example.com',
        )
        own = Certificate.objects.create(
            registration=Registration.objects.create(event=event, participant=own_participant),
        )
        other = Certificate.objects.create(
            registration=Registration.objects.create(event=event, participant=other_participant),
        )

        certificates = self.client.get('/attendance/certificates/')
        self.assertEqual(certificates.status_code, 200)
        self.assertEqual(certificates.data['count'], 1)
        self.assertEqual(str(certificates.data['results'][0]['id']), str(own.id))
        self.assertEqual(self.client.get(f'/attendance/certificates/{other.id}/').status_code, 404)
        self.assertEqual(self.client.post('/attendance/certificates/', {}, format='json').status_code, 403)
        self.assertEqual(self.client.get('/attendance/users/').status_code, 403)
        self.assertEqual(self.client.get('/attendance/events/').status_code, 403)

    def test_signup_does_not_accept_privileged_role(self):
        response = self.client.post('/attendance/sign-up/', {
            'first_name': 'Luis',
            'last_name': 'Prueba',
            'email': 'luis@example.com',
            'password': 'UnaClaveSegura2026!',
            'user_type': 'admin',
            'is_staff': True,
        }, format='json')
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(email='luis@example.com')
        self.assertEqual(user.user_type, 'member')
        self.assertFalse(user.is_staff)

    def test_password_recovery_requires_valid_new_password(self):
        user = User.objects.create_user(
            email='recuperar@example.com', password='ClaveAnterior2026!',
            first_name='Ana', last_name='Prueba', user_type='member', is_active=True,
        )
        requested = self.client.post('/attendance/request-password-reset/', {
            'email': user.email,
        }, format='json')
        self.assertEqual(requested.status_code, 200)
        user.refresh_from_db()

        rejected = self.client.post('/attendance/confirm-password-reset/', {
            'token': str(user.reset_token), 'new_password': '',
        }, format='json')
        self.assertEqual(rejected.status_code, 400)

        confirmed = self.client.post('/attendance/confirm-password-reset/', {
            'token': str(user.reset_token), 'new_password': 'ClaveNueva2026!',
        }, format='json')
        self.assertEqual(confirmed.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password('ClaveNueva2026!'))
