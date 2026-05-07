from django.db import migrations, models


def ativo_para_sem_contrato(apps, schema_editor):
    Medico = apps.get_model("medicos", "Medico")
    Medico.objects.filter(status="ativo").update(status="ativo_sem_contrato")


class Migration(migrations.Migration):

    dependencies = [
        ("medicos", "0009_seed_especialidades"),
    ]

    operations = [
        migrations.AlterField(
            model_name="medico",
            name="status",
            field=models.CharField(
                choices=[
                    ("pendente", "Pendente"),
                    ("ativo_com_contrato", "Ativo em contrato"),
                    ("ativo_sem_contrato", "Ativo sem contrato"),
                    ("inativo", "Inativo"),
                ],
                default="pendente",
                max_length=20,
                verbose_name="Status",
            ),
        ),
        migrations.RunPython(ativo_para_sem_contrato, migrations.RunPython.noop),
    ]
