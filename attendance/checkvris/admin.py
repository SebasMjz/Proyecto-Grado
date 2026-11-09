from django.contrib import admin
from import_export import resources, fields
from import_export.admin import ImportExportModelAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm

from checkvris.models import Attendance, Certificate, Event, EventSession, Participant, Registration, User

class UserResource(resources.ModelResource):

    class Meta:
        model = User



class UserAdmin(ImportExportModelAdmin, BaseUserAdmin):
    add_form = UserCreationForm
    form = UserChangeForm
    model = User
    resource_classes = [UserResource]

    list_display = (
        "email", "first_name", "last_name", "user_type",
        "phone", 
    )
    list_filter = ("user_type", "is_staff", "is_active", "is_superuser", "phone")
    ordering = ("email",)

    # Campos que se muestran al EDITAR un usuario
    fieldsets = (
        ("Credenciales", {"fields": ("email", "password")}),
        ("Información personal", {
            "fields": (
                "first_name", "last_name",
                "user_type", "phone"
            )
        }),
        #("Relaciones", {
        #    "fields": (
        #        "committee", "group", "missions", "site"
        #    )
        #}),
        #("Extra", {"fields": ("points", "is_active_email")}),
        ("Permisos", {
            "fields": (
                "is_staff", "is_active", "is_superuser",
                "groups", "user_permissions"
            )
        }),

    )

    # Campos que se muestran al CREAR un usuario desde el admin
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email", "first_name", "last_name", "user_type",
                "password1", "password2",
                "is_staff", "is_active", "is_superuser"
            )
        }),
    )

    search_fields = ("email", "first_name", "last_name", "phone")


class LockedAttendanceAdmin(admin.ModelAdmin):
    def get_actions(self, request):
        actions = super().get_actions(request)
        actions.pop('delete_selected', None)
        return actions

    def has_change_permission(self, request, obj=None):
        event = getattr(obj, 'event', None) or getattr(getattr(obj, 'registration', None), 'event', None)
        if event and event.attendance_closed_at:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        event = getattr(obj, 'event', None) or getattr(getattr(obj, 'registration', None), 'event', None)
        if event and event.attendance_closed_at:
            return False
        return super().has_delete_permission(request, obj)


class EventAdmin(LockedAttendanceAdmin):
    def has_change_permission(self, request, obj=None):
        if obj and obj.attendance_closed_at:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        if obj and obj.attendance_closed_at:
            return False
        return super().has_delete_permission(request, obj)


class CertificateAdmin(LockedAttendanceAdmin):
    def has_change_permission(self, request, obj=None):
        if obj and obj.snapshot:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        if obj and obj.snapshot:
            return False
        return super().has_delete_permission(request, obj)


admin.site.register(User, UserAdmin)
admin.site.register(Participant, LockedAttendanceAdmin)
admin.site.register(Event, EventAdmin)
admin.site.register(EventSession, LockedAttendanceAdmin)
admin.site.register(Registration, LockedAttendanceAdmin)
admin.site.register(Attendance, LockedAttendanceAdmin)
admin.site.register(Certificate, CertificateAdmin)
