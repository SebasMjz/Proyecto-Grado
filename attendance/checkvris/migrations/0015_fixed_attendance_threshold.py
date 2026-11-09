from django.db import migrations, models


def set_threshold(apps, schema_editor):
    apps.get_model('checkvris', 'Event').objects.update(
        requires_attendance_for_certificate=True, minimum_attendance_percentage=50,
    )


class Migration(migrations.Migration):
    dependencies = [('checkvris', '0014_legacy_certificates')]

    operations = [
        migrations.AlterField(model_name='event', name='requires_attendance_for_certificate',
                              field=models.BooleanField(default=True, help_text='El participante debe asistir a más del 50 % de las sesiones activas.')),
        migrations.AlterField(model_name='event', name='minimum_attendance_percentage',
                              field=models.IntegerField(default=50, help_text='Umbral fijo: se exige estrictamente más del 50 %.')),
        migrations.RunPython(set_threshold, migrations.RunPython.noop),
    ]
