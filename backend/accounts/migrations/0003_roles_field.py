from django.db import migrations, models


def role_to_roles(apps, schema_editor):
    """Converte campo role (str) para roles (list)."""
    CustomUser = apps.get_model("accounts", "CustomUser")
    for user in CustomUser.objects.all():
        role = getattr(user, "role", "medico") or "medico"
        user.roles = [role]
        user.save(update_fields=["roles"])


def roles_to_role(apps, schema_editor):
    """Reverte: pega o primeiro item de roles como role."""
    CustomUser = apps.get_model("accounts", "CustomUser")
    for user in CustomUser.objects.all():
        roles = user.roles or ["medico"]
        user.role = roles[0]
        user.save(update_fields=["role"])


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_must_change_password"),
    ]

    operations = [
        # 1. Adiciona o novo campo roles
        migrations.AddField(
            model_name="customuser",
            name="roles",
            field=models.JSONField(default=list, verbose_name="Perfis"),
        ),
        # 2. Copia dados de role → roles
        migrations.RunPython(role_to_roles, reverse_code=roles_to_role),
        # 3. Remove o campo antigo role
        migrations.RemoveField(
            model_name="customuser",
            name="role",
        ),
    ]
