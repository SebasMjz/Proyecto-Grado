from django.db import migrations, models


def copy_recipient_email(apps, schema_editor):
    Certificate = apps.get_model('checkvris', 'Certificate')
    for certificate in Certificate.objects.select_related('registration__participant').iterator():
        certificate.recipient_email = certificate.registration.participant.email
        certificate.save(update_fields=['recipient_email'])


class Migration(migrations.Migration):
    dependencies = [('checkvris', '0011_alter_user_user_type')]

    operations = [
        migrations.AddField(
            model_name='event', name='attendance_closed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='certificate', name='recipient_email',
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.RunPython(copy_recipient_email, migrations.RunPython.noop),
    ]
