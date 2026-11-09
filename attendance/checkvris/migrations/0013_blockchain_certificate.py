from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('checkvris', '0012_certificate_issuance')]

    operations = [
        migrations.AddField(model_name='user', name='wallet_address', field=models.CharField(blank=True, max_length=42)),
        migrations.AddField(model_name='user', name='wallet_challenge', field=models.UUIDField(blank=True, null=True)),
        migrations.AddField(model_name='certificate', name='snapshot', field=models.JSONField(blank=True, default=dict)),
        migrations.AddField(model_name='certificate', name='content_hash', field=models.CharField(blank=True, max_length=64)),
        migrations.AddField(model_name='certificate', name='recipient_wallet', field=models.CharField(blank=True, max_length=42)),
        migrations.AddField(model_name='certificate', name='chain_id', field=models.PositiveIntegerField(blank=True, null=True)),
        migrations.AddField(model_name='certificate', name='contract_address', field=models.CharField(blank=True, max_length=42)),
        migrations.AddField(model_name='certificate', name='transaction_hash', field=models.CharField(blank=True, max_length=66)),
        migrations.AddField(model_name='certificate', name='token_id', field=models.PositiveBigIntegerField(blank=True, null=True)),
        migrations.AddField(model_name='certificate', name='blockchain_status', field=models.CharField(choices=[
            ('pending_wallet', 'Sin billetera'), ('pending_chain', 'Pendiente en blockchain'),
            ('confirmed', 'Confirmado en blockchain'), ('failed', 'Error en blockchain'),
        ], default='pending_wallet', max_length=20)),
    ]
