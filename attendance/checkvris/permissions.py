from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsInstitutionalUser(BasePermission):
    """Keep publicly registered members out of administrative APIs."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.user_type != 'member'
        )


class CertificateAccessPermission(BasePermission):
    """Members can only read certificates; queryset scoping enforces ownership."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.user_type != 'member' or request.method in SAFE_METHODS
