from django.db import migrations, models
import medicos.models


class Migration(migrations.Migration):

    dependencies = [
        ("medicos", "0005_consolidate_rg_crm_docs"),
    ]

    operations = [
        migrations.AddField(
            model_name="medico",
            name="curriculo_lattes",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to=medicos.models.upload_curriculo_lattes,
                verbose_name="Currículo Lattes resumido atualizado",
            ),
        ),
    ]
