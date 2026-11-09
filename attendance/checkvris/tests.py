from datetime import date, time
from unittest.mock import patch

from django.core import mail
from django.core.exceptions import ValidationError
from django.test import override_settings
from rest_framework.test import APITestCase
from eth_account import Account
from eth_account.messages import encode_defunct

from checkvris.models import Attendance, Certificate, Event, EventSession, Participant, PasswordResetCode, Registration, StatusRegistration, User


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
            recipient_email=own_participant.email,
        )
        other = Certificate.objects.create(
            registration=Registration.objects.create(event=event, participant=other_participant),
            recipient_email=other_participant.email,
        )
        inactive = Certificate.objects.create(
            registration=Registration.objects.create(
                event=Event.objects.create(
                    title='Otro seminario', description='Evento de prueba', location='Campus',
                    start_date=date(2026, 11, 2), end_date=date(2026, 11, 2), created_by=issuer,
                ), participant=own_participant,
            ),
            is_active=False,
            recipient_email=own_participant.email,
        )

        self.client.credentials()
        self.assertEqual(self.client.get('/attendance/certificates/').status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['token']}")

        certificates = self.client.get('/attendance/certificates/')
        self.assertEqual(certificates.status_code, 200)
        self.assertEqual(certificates.data['count'], 1)
        self.assertEqual(str(certificates.data['results'][0]['id']), str(own.id))
        self.assertEqual(self.client.get(f'/attendance/certificates/{own.id}/').status_code, 200)
        self.assertEqual(self.client.get(f'/attendance/certificates/{other.id}/').status_code, 404)
        self.assertEqual(self.client.post(f'/attendance/certificates/{other.id}/mint/').status_code, 404)
        self.assertEqual(self.client.get(f'/attendance/certificates/{inactive.id}/').status_code, 404)
        self.assertEqual(self.client.post('/attendance/certificates/', {}, format='json').status_code, 403)
        self.assertEqual(self.client.delete(f'/attendance/certificates/{own.id}/').status_code, 403)
        self.assertEqual(self.client.get('/attendance/users/').status_code, 403)
        self.assertEqual(self.client.get('/attendance/events/').status_code, 403)

        self.client.force_authenticate(user=issuer)
        self.assertEqual(self.client.get('/attendance/certificates/').data['count'], 3)

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


class CertificateIssuanceTests(APITestCase):
    def setUp(self):
        self.organizer = User.objects.create_user(
            email='organizer@example.com', password='UnaClaveSegura2026!',
            first_name='Organizador', last_name='Prueba', user_type='staff', is_active=True,
        )
        self.member = User.objects.create_user(
            email='ana@example.com', password='UnaClaveSegura2026!',
            first_name='Ana', last_name='Pérez', user_type='member', is_active=True,
        )
        self.event = Event.objects.create(
            title='Seminario', description='Evento de prueba', location='Campus',
            start_date=date(2026, 11, 1), end_date=date(2026, 11, 2), created_by=self.organizer,
        )
        participant = Participant.objects.create(first_name='Ana', last_name='Pérez', email=self.member.email)
        self.registration = Registration.objects.create(
            event=self.event, participant=participant, status=StatusRegistration.CONFIRMED,
        )
        self.sessions = [EventSession.objects.create(
            event=self.event, session_date=date(2026, 11, day),
            start_time=time(9), end_time=time(10),
        ) for day in (1, 2)]
        self.client.force_authenticate(user=self.organizer)

    def test_requires_more_than_half_sessions_and_organizer_confirmation(self):
        Attendance.objects.create(registration=self.registration, session=self.sessions[0])
        self.assertEqual(self.client.post('/attendance/certificates/issue/', {
            'registration_id': str(self.registration.id),
        }).status_code, 400)
        self.assertEqual(self.client.get('/attendance/certificates/eligible/', {
            'event': str(self.event.id),
        }).data['results'], [])
        self.assertEqual(self.client.post(f'/attendance/events/{self.event.id}/close-attendance/').status_code, 200)
        self.assertEqual(self.client.post('/attendance/attendances/', {
            'registration_id': str(self.registration.id), 'session_id': str(self.sessions[1].id),
        }).status_code, 400)
        with self.assertRaises(ValidationError):
            Attendance.objects.create(registration=self.registration, session=self.sessions[1])

    def test_three_sessions_need_two_attendances(self):
        EventSession.objects.create(event=self.event, session_date=date(2026, 11, 2),
                                    start_time=time(11), end_time=time(12))
        Attendance.objects.create(registration=self.registration, session=self.sessions[0])
        self.assertFalse(self.registration.is_eligible_for_certificate)
        Attendance.objects.create(registration=self.registration, session=self.sessions[1])
        self.assertTrue(self.registration.is_eligible_for_certificate)

    def test_eligible_issuance_freezes_attendance_and_certificate_ownership(self):
        for session in self.sessions:
            Attendance.objects.create(registration=self.registration, session=session)
        self.assertEqual(self.client.post('/attendance/certificates/issue/', {
            'registration_id': str(self.registration.id),
        }).status_code, 400)
        self.client.post(f'/attendance/events/{self.event.id}/close-attendance/')
        eligible = self.client.get('/attendance/certificates/eligible/', {'event': str(self.event.id)})
        self.assertEqual(len(eligible.data['results']), 1)
        issued = self.client.post('/attendance/certificates/issue/', {
            'registration_id': str(self.registration.id),
        }, format='json')
        self.assertEqual(issued.status_code, 201)
        certificate = Certificate.objects.get(registration=self.registration)
        self.assertEqual(certificate.recipient_email, self.member.email)
        self.assertEqual(self.client.post('/attendance/certificates/issue/', {
            'registration_id': str(self.registration.id),
        }).status_code, 400)
        self.assertEqual(self.client.patch(f'/attendance/attendances/{self.registration.attendances.first().id}/', {
            'notes': 'Cambio',
        }, format='json').status_code, 400)
        self.assertEqual(self.client.delete(f'/attendance/sessions/{self.sessions[0].id}/').status_code, 400)
        self.assertEqual(self.client.patch(f'/attendance/registrations/{self.registration.id}/', {
            'status': StatusRegistration.CANCELLED,
        }, format='json').status_code, 400)
        self.assertEqual(self.client.patch(f'/attendance/certificates/{certificate.id}/', {
            'is_active': False,
        }, format='json').status_code, 405)
        self.client.force_authenticate(user=self.member)
        self.assertEqual(self.client.get('/attendance/certificates/').data['count'], 1)

    def test_wallet_requires_signature_and_mint_waits_for_chain_configuration(self):
        for session in self.sessions:
            Attendance.objects.create(registration=self.registration, session=session)
        self.client.post(f'/attendance/events/{self.event.id}/close-attendance/')
        issued = self.client.post('/attendance/certificates/issue/', {
            'registration_id': str(self.registration.id),
        }, format='json')
        self.assertEqual(issued.status_code, 201)
        certificate = Certificate.objects.get(registration=self.registration)
        self.assertEqual(len(certificate.content_hash), 64)
        self.client.force_authenticate(user=self.member)
        wallet = Account.create()
        challenge = self.client.get('/attendance/me/wallet-challenge/').data['message']
        self.assertEqual(self.client.post('/attendance/me/wallet-challenge/', {
            'address': wallet.address, 'signature': '0xinvalid',
        }, format='json').status_code, 400)
        signature = Account.sign_message(encode_defunct(text=challenge), wallet.key).signature.hex()
        self.assertEqual(self.client.post('/attendance/me/wallet-challenge/', {
            'address': wallet.address, 'signature': signature,
        }, format='json').status_code, 200)
        self.assertEqual(self.client.post('/attendance/me/wallet-challenge/', {
            'address': wallet.address, 'signature': signature,
        }, format='json').status_code, 400)
        self.assertEqual(self.client.post(f'/attendance/certificates/{certificate.id}/mint/').status_code, 400)
        certificate.refresh_from_db()
        self.assertEqual(certificate.blockchain_status, 'pending_wallet')
        self.assertFalse(self.client.get(f'/attendance/verify/{certificate.certificate_code}/').data['verified'])

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_certificate_waits_for_account_and_sends_notice(self):
        self.member.delete()
        for session in self.sessions:
            Attendance.objects.create(registration=self.registration, session=session)
        self.client.post(f'/attendance/events/{self.event.id}/close-attendance/')
        with self.captureOnCommitCallbacks(execute=True):
            issued = self.client.post('/attendance/certificates/issue/', {
                'registration_id': str(self.registration.id),
            }, format='json')
        self.assertEqual(issued.status_code, 201)
        self.assertEqual(mail.outbox[-1].to, ['ana@example.com'])
        self.member = User.objects.create_user(
            email='ana@example.com', password='UnaClaveSegura2026!',
            first_name='Ana', last_name='Pérez', user_type='member', is_active=True,
        )
        self.client.force_authenticate(user=self.member)
        self.assertEqual(self.client.get('/attendance/certificates/').data['count'], 1)

    def test_public_verification_only_reports_confirmed_on_chain_data(self):
        for session in self.sessions:
            Attendance.objects.create(registration=self.registration, session=session)
        self.client.post(f'/attendance/events/{self.event.id}/close-attendance/')
        self.client.post('/attendance/certificates/issue/', {
            'registration_id': str(self.registration.id),
        }, format='json')
        certificate = Certificate.objects.get(registration=self.registration)
        certificate.blockchain_status = 'confirmed'
        certificate.recipient_wallet = Account.create().address
        certificate.token_id = 1
        certificate.chain_id = 11155111
        certificate.transaction_hash = '0x' + 'a' * 64
        certificate.save(update_fields=['blockchain_status', 'recipient_wallet', 'token_id', 'chain_id', 'transaction_hash'])
        self.client.force_authenticate(user=None)
        with patch('checkvris.views.verify_certificate', return_value=True):
            response = self.client.get(f'/attendance/verify/{certificate.certificate_code}/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['verified'])
        self.assertNotIn('email', response.data)
        self.assertEqual(self.client.get(f'/attendance/certificates/{certificate.id}/metadata/').status_code, 200)
