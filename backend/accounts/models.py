from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


ROLE_CHOICES = [
    ("medico", "Médico"),
    ("gestor", "Gestor"),
    ("admin", "Administrador"),
]

ROLE_LABELS = {key: label for key, label in ROLE_CHOICES}


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("O e-mail é obrigatório.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("roles", ["admin"])
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    username = None
    email = models.EmailField(unique=True, verbose_name="E-mail")
    nome = models.CharField(max_length=200, verbose_name="Nome")
    roles = models.JSONField(
        default=list,
        verbose_name="Perfis",
    )

    must_change_password = models.BooleanField(
        default=False,
        verbose_name="Deve alterar senha",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nome"]

    objects = CustomUserManager()

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"

    def has_role(self, role: str) -> bool:
        return role in (self.roles or [])

    def __str__(self):
        labels = [ROLE_LABELS.get(r, r) for r in (self.roles or [])]
        return f"{self.nome} ({', '.join(labels)})"


class Funcionario(models.Model):
    """Perfil básico para usuários sem papel de médico (gestores, admins)."""

    class Status(models.TextChoices):
        ATIVO = "ativo", "Ativo"
        INATIVO = "inativo", "Inativo"

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="funcionario",
        verbose_name="Usuário",
    )
    cpf = models.CharField(
        max_length=14, null=True, blank=True, unique=True, verbose_name="CPF"
    )
    data_nascimento = models.DateField(null=True, blank=True, verbose_name="Data de nascimento")
    email = models.EmailField(blank=True, verbose_name="E-mail de contato")
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ATIVO,
        verbose_name="Status",
    )

    class Meta:
        verbose_name = "Funcionário"
        verbose_name_plural = "Funcionários"

    def __str__(self):
        return f"{self.user.nome} ({self.get_status_display()})"
