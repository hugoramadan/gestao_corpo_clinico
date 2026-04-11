from django.db import migrations, models
import medicos.models


class Migration(migrations.Migration):

    dependencies = [
        ("medicos", "0004_add_estado_civil_rg_docs"),
    ]

    operations = [
        # Remove campos separados de frente/verso
        migrations.RemoveField(model_name="medico", name="rg_frente"),
        migrations.RemoveField(model_name="medico", name="rg_verso"),
        migrations.RemoveField(model_name="medico", name="crm_frente"),
        migrations.RemoveField(model_name="medico", name="crm_verso"),
        # Adiciona campos únicos (frente e verso em um só arquivo)
        migrations.AddField(
            model_name="medico",
            name="rg",
            field=models.FileField(blank=True, null=True, upload_to=medicos.models.upload_rg, verbose_name="RG (frente e verso)"),
        ),
        migrations.AddField(
            model_name="medico",
            name="crm_doc",
            field=models.FileField(blank=True, null=True, upload_to=medicos.models.upload_crm_doc, verbose_name="CRM (frente e verso)"),
        ),
    ]
