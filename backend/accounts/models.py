from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


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
        extra_fields.setdefault("role", CustomUser.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        MEDICO = "medico", "Médico"
        GESTOR = "gestor", "Gestor"
        ADMIN = "admin", "Administrador"

    username = None
    email = models.EmailField(unique=True, verbose_name="E-mail")
    nome = models.CharField(max_length=200, verbose_name="Nome")
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.MEDICO,
        verbose_name="Perfil",
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

    def __str__(self):
        return f"{self.nome} ({self.get_role_display()})"
