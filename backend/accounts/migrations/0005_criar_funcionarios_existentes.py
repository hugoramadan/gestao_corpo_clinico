from django.db import migrations


def criar_funcionarios(apps, schema_editor):
    """Cria Funcionario para todos os usuários sem médico e sem funcionário."""
    CustomUser = apps.get_model("accounts", "CustomUser")
    Funcionario = apps.get_model("accounts", "Funcionario")
    for user in CustomUser.objects.all():
        roles = user.roles or []
        if "medico" not in roles:
            Funcionario.objects.get_or_create(
                user=user,
                defaults={"email": user.email, "status": "ativo"},
            )


def reverter(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_funcionario_model"),
    ]

    operations = [
        migrations.RunPython(criar_funcionarios, reverse_code=reverter),
    ]
