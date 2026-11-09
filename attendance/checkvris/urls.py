from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from checkvris.views import (
    LoginView, PublicSignUpView, CurrentUserView, WalletChallengeView, VerifyCertificateView, ActivateAccountView, ResendActivationCodeView,
    RequestPasswordResetView, ConfirmPasswordResetView,
    EventViewSet, EventSessionViewSet, ParticipantViewSet,
    RegistrationViewSet, AttendanceViewSet, CertificateViewSet, UserViewSet
)

router = DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"participants", ParticipantViewSet)
router.register(r"events", EventViewSet)
router.register(r"sessions", EventSessionViewSet)
router.register(r"registrations", RegistrationViewSet)
router.register(r"attendances", AttendanceViewSet)
router.register(r"certificates", CertificateViewSet)
## Ruta pre-registrations eliminada

urlpatterns = [
    path("", include(router.urls)),
    ##path("check-in/", CheckInView.as_view(), name="check-in"),

    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('me/wallet-challenge/', WalletChallengeView.as_view(), name='wallet-challenge'),
    path('verify/<uuid:code>/', VerifyCertificateView.as_view(), name='verify-certificate'),
    path('sign-up/', PublicSignUpView.as_view(), name='sign-up'),
    path('activate-account/', ActivateAccountView.as_view(), name='activate-account'),
    path('resend-activation/', ResendActivationCodeView.as_view(), name='resend-activation'),
    path("request-password-reset/", RequestPasswordResetView.as_view()),
    path("confirm-password-reset/", ConfirmPasswordResetView.as_view()),
]
