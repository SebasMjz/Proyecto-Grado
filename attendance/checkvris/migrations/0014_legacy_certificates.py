from django.db import migrations, models


def mark_legacy(apps, schema_editor):
    apps.get_model('checkvris', 'Certificate').objects.filter(snapshot={}).update(blockchain_status='legacy')


class Migration(migrations.Migration):
    dependencies = [('checkvris', '0013_blockchain_certificate')]

    operations = [
        migrations.AlterField(model_name='certificate', name='blockchain_status', field=models.CharField(
            choices=[('legacy', 'Emisión previa sin respaldo blockchain'),
                     ('pending_wallet', 'Sin billetera'), ('pending_chain', 'Pendiente en blockchain'),
                     ('confirmed', 'Confirmado en blockchain'), ('failed', 'Error en blockchain')],
            default='pending_wallet', max_length=20,
        )),
        migrations.RunPython(mark_legacy, migrations.RunPython.noop),
    ]
