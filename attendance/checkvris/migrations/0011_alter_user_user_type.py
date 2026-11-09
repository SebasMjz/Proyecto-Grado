from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('checkvris', '0010_delete_whatsappdeliverylog'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='user_type',
            field=models.CharField(
                choices=[
                    ('admin', 'Administrator'),
                    ('vicerrectora', 'Vicerectora'),
                    ('director_nacional', 'Director Nacional'),
                    ('staff', 'Personal'),
                    ('member', 'Usuario registrado'),
                ],
                default='staff',
                max_length=20,
            ),
        ),
    ]
