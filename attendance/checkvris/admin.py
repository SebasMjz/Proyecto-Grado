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


admin.site.register(User, UserAdmin)
admin.site.register(Participant)
admin.site.register(Event)
admin.site.register(EventSession)
admin.site.register(Registration)
admin.site.register(Attendance)
admin.site.register(Certificate)
