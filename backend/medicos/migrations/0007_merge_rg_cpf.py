from django.db import migrations, models
import medicos.models


class Migration(migrations.Migration):

    dependencies = [
        ("medicos", "0006_add_curriculo_lattes"),
    ]

    operations = [
        migrations.RemoveField(model_name="medico", name="rg"),
        migrations.RemoveField(model_name="medico", name="cpf_doc"),
        migrations.AddField(
            model_name="medico",
            name="rg_cpf",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to=medicos.models.upload_rg_cpf,
                verbose_name="RG e CPF (frente e verso)",
            ),
        ),
    ]
