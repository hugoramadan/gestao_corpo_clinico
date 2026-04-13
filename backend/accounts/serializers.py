from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser, Funcionario
from core.validators import validate_cpf_digits


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["nome"] = user.nome
        token["email"] = user.email
        token["roles"] = user.roles
        token["must_change_password"] = user.must_change_password
        return token

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        from rest_framework.exceptions import AuthenticationFailed

        # Verifica credenciais antes do super() para distinguir "inativo" de "senha errada"
        email = attrs.get(self.username_field, "")
        password = attrs.get("password", "")
        user = CustomUser.objects.filter(email=email).first()
        if user is not None and user.check_password(password) and not user.is_active:
            raise AuthenticationFailed(
                {"code": "user_inactive", "detail": "Sua conta está inativa. Entre em contato com o administrador do sistema."},
            )

        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "nome": self.user.nome,
            "email": self.user.email,
            "roles": self.user.roles,
            "must_change_password": self.user.must_change_password,
        }
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    cpf = serializers.CharField(max_length=14, required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = ["email", "nome", "password", "password_confirm", "cpf"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "As senhas não conferem."})
        return attrs

    def validate_cpf(self, value):
        if not value:
            return value
        digits = value.replace(".", "").replace("-", "")
        if not validate_cpf_digits(digits):
            raise serializers.ValidationError("CPF inválido.")
        from medicos.models import Medico
        if Medico.objects.filter(cpf=value).exists():
            raise serializers.ValidationError("Já existe um cadastro com este CPF.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password_confirm")
        cpf = validated_data.pop("cpf", "")
        user = CustomUser.objects.create_user(
            roles=["medico"],
            must_change_password=False,
            **validated_data,
        )
        from medicos.models import Medico
        Medico.objects.create(
            user=user,
            nome_completo=user.nome,
            cpf=cpf or None,
            email=user.email,
        )
        return user


# ---------------------------------------------------------------------------
# Funcionário
# ---------------------------------------------------------------------------

class FuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = ["cpf", "data_nascimento", "email", "status"]

    def validate_cpf(self, value):
        if not value:
            return value
        digits = value.replace(".", "").replace("-", "")
        if not validate_cpf_digits(digits):
            raise serializers.ValidationError("CPF inválido.")
        # Verifica unicidade excluindo o próprio registro
        user_instance = self.parent.instance if self.parent else None
        qs = Funcionario.objects.filter(cpf=value)
        if user_instance and hasattr(user_instance, "funcionario"):
            qs = qs.exclude(pk=user_instance.funcionario.pk)
        if qs.exists():
            raise serializers.ValidationError("Já existe um cadastro com este CPF.")
        return value


# ---------------------------------------------------------------------------
# Usuário
# ---------------------------------------------------------------------------

VALID_ROLES = {"medico", "gestor", "admin"}


class UserSerializer(serializers.ModelSerializer):
    funcionario = FuncionarioSerializer(read_only=True)
    status = serializers.SerializerMethodField()

    def get_status(self, obj):
        """Retorna o status do perfil vinculado (médico ou funcionário)."""
        try:
            return obj.medico.status
        except AttributeError:
            pass
        try:
            return obj.funcionario.status
        except AttributeError:
            pass
        return None

    class Meta:
        model = CustomUser
        fields = [
            "id", "email", "nome", "roles", "is_active",
            "date_joined", "must_change_password", "funcionario", "status",
        ]
        read_only_fields = ["id", "date_joined", "status"]


class UserCreateSerializer(serializers.ModelSerializer):
    """Admin cria qualquer usuário com senha provisória."""
    password = serializers.CharField(write_only=True, min_length=8)
    roles = serializers.ListField(
        child=serializers.ChoiceField(choices=list(VALID_ROLES)),
        min_length=1,
    )
    # CPF usado para médico OU funcionário conforme os roles
    cpf = serializers.CharField(max_length=14, required=False, allow_blank=True, default="")
    data_nascimento = serializers.DateField(required=False, allow_null=True)
    email_contato = serializers.EmailField(required=False, allow_blank=True, default="")

    class Meta:
        model = CustomUser
        fields = ["email", "nome", "roles", "password", "cpf", "data_nascimento", "email_contato"]

    def validate_roles(self, value):
        if not value:
            raise serializers.ValidationError("Selecione ao menos um perfil.")
        invalid = set(value) - VALID_ROLES
        if invalid:
            raise serializers.ValidationError(f"Perfis inválidos: {', '.join(invalid)}")
        roles = list(set(value))
        # Gestores só podem criar usuários com perfil médico
        request = self.context.get("request")
        if request and not (set(request.user.roles or []) & {"admin"}):
            forbidden = set(roles) - {"medico"}
            if forbidden:
                raise serializers.ValidationError(
                    "Gestores só podem criar usuários com perfil Médico."
                )
        return roles

    def validate_cpf(self, value):
        if not value:
            return value
        digits = value.replace(".", "").replace("-", "")
        if not validate_cpf_digits(digits):
            raise serializers.ValidationError("CPF inválido.")
        from medicos.models import Medico
        if Medico.objects.filter(cpf=value).exists():
            raise serializers.ValidationError("Já existe um cadastro com este CPF.")
        if Funcionario.objects.filter(cpf=value).exists():
            raise serializers.ValidationError("Já existe um cadastro com este CPF.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        cpf = validated_data.pop("cpf", "")
        data_nascimento = validated_data.pop("data_nascimento", None)
        email_contato = validated_data.pop("email_contato", "")
        user = CustomUser.objects.create_user(
            must_change_password=True,
            **validated_data,
        )
        roles = user.roles or []
        if "medico" in roles:
            from medicos.models import Medico
            Medico.objects.create(
                user=user,
                nome_completo=user.nome,
                cpf=cpf or None,
                email=user.email,
            )
        else:
            # Gestor / Admin sem papel de médico → cria perfil funcionário
            Funcionario.objects.create(
                user=user,
                cpf=cpf or None,
                data_nascimento=data_nascimento,
                email=email_contato or user.email,
            )
        return user


class UserManagementSerializer(serializers.ModelSerializer):
    """Admin edita usuário existente. Senha opcional (reset provisório)."""
    new_password = serializers.CharField(
        write_only=True, required=False, allow_blank=True, min_length=8
    )
    roles = serializers.ListField(
        child=serializers.ChoiceField(choices=list(VALID_ROLES)),
        min_length=1,
        required=False,
    )
    funcionario = FuncionarioSerializer(required=False)

    class Meta:
        model = CustomUser
        fields = [
            "id", "email", "nome", "roles", "is_active",
            "must_change_password", "date_joined", "new_password", "funcionario",
        ]
        read_only_fields = ["id", "date_joined"]

    def validate_roles(self, value):
        if not value:
            raise serializers.ValidationError("Selecione ao menos um perfil.")
        return list(set(value))

    def validate(self, attrs):
        request = self.context.get("request")
        if request and self.instance == request.user:
            if "roles" in attrs and set(attrs["roles"]) != set(self.instance.roles or []):
                raise serializers.ValidationError({"roles": "Você não pode alterar seu próprio perfil."})
            if "is_active" in attrs and attrs["is_active"] is False:
                raise serializers.ValidationError({"is_active": "Você não pode desativar sua própria conta."})
        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        old_roles = set(instance.roles or [])

        new_password = validated_data.pop("new_password", None)
        funcionario_data = validated_data.pop("funcionario", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if new_password:
            instance.set_password(new_password)
            instance.must_change_password = True

        # Atualiza perfil de funcionário se enviado — só aplica se o usuário
        # tem roles não-médicos (gestores/admins têm Funcionario, médicos não)
        roles_after_edit = set(validated_data.get("roles", instance.roles) or [])
        has_non_medico_role = bool(roles_after_edit - {"medico"})
        if funcionario_data is not None and has_non_medico_role:
            func, _ = Funcionario.objects.get_or_create(user=instance)
            for attr, value in funcionario_data.items():
                setattr(func, attr, value)
            func.save()
            # Sincroniza is_active com o status do funcionário
            instance.is_active = (func.status == Funcionario.Status.ATIVO)

        instance.save()

        new_roles = set(instance.roles or [])

        # Reconciliação de domínio: médico adicionado → criar Medico se não existir
        if "medico" in new_roles - old_roles:
            from medicos.models import Medico
            if not Medico.objects.filter(user=instance).exists():
                Medico.objects.create(
                    user=instance,
                    nome_completo=instance.nome,
                    email=instance.email,
                )

        # Reconciliação de domínio: médico removido → desvincular sem destruir o registro clínico
        if "medico" in old_roles - new_roles:
            from medicos.models import Medico
            try:
                medico = instance.medico
                medico.user = None
                medico.status = Medico.Status.INATIVO
                medico.save(update_fields=["user", "status"])
            except Medico.DoesNotExist:
                pass

        # Reconciliação de domínio: não-médico sem Funcionario → garantir que existe
        if new_roles - {"medico"} and not Funcionario.objects.filter(user=instance).exists():
            Funcionario.objects.create(user=instance)

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """Qualquer usuário autenticado troca a própria senha."""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Senha atual incorreta.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "As senhas não conferem."})
        return attrs
