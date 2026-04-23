from django.db import migrations


def seed_especialidades(apps, schema_editor):
    from medicos.especialidades_padrao import ESPECIALIDADES

    Especialidade = apps.get_model("medicos", "Especialidade")
    for nome in ESPECIALIDADES:
        Especialidade.objects.get_or_create(nome=nome)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("medicos", "0008_cpf_nullable"),
    ]

    operations = [
        migrations.RunPython(seed_especialidades, reverse_code=noop),
    ]
