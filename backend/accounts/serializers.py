from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["nome"] = user.nome
        token["email"] = user.email
        token["role"] = user.role
        token["must_change_password"] = user.must_change_password
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "nome": self.user.nome,
            "email": self.user.email,
            "role": self.user.role,
            "must_change_password": self.user.must_change_password,
        }
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    # Campos do cadastro médico (opcionais no registro inicial)
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
        if not digits.isdigit() or len(digits) != 11:
            raise serializers.ValidationError("CPF inválido. Informe 11 dígitos numéricos.")
        from medicos.models import Medico
        if Medico.objects.filter(cpf=value).exists():
            raise serializers.ValidationError("Já existe um cadastro com este CPF.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password_confirm")
        cpf = validated_data.pop("cpf", "")
        user = CustomUser.objects.create_user(
            role=CustomUser.Role.MEDICO,
            must_change_password=False,
            **validated_data,
        )
        # Criar o registro médico vinculado ao usuário
        from medicos.models import Medico
        Medico.objects.create(
            user=user,
            nome_completo=user.nome,
            cpf=cpf or None,
            email=user.email,
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "nome", "role", "is_active", "date_joined", "must_change_password"]
        read_only_fields = ["id", "date_joined"]


class UserCreateSerializer(serializers.ModelSerializer):
    """Admin cria qualquer usuário com senha provisória."""
    password = serializers.CharField(write_only=True, min_length=8)
    cpf = serializers.CharField(max_length=14, required=False, allow_blank=True, default="")

    class Meta:
        model = CustomUser
        fields = ["email", "nome", "role", "password", "cpf"]

    def validate_cpf(self, value):
        if not value:
            return value
        digits = value.replace(".", "").replace("-", "")
        if not digits.isdigit() or len(digits) != 11:
            raise serializers.ValidationError("CPF inválido. Informe 11 dígitos numéricos.")
        from medicos.models import Medico
        if Medico.objects.filter(cpf=value).exists():
            raise serializers.ValidationError("Já existe um cadastro com este CPF.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        cpf = validated_data.pop("cpf", "")
        user = CustomUser.objects.create_user(
            must_change_password=True,
            **validated_data,
        )
        if user.role == CustomUser.Role.MEDICO:
            from medicos.models import Medico
            Medico.objects.create(
                user=user,
                nome_completo=user.nome,
                cpf=cpf or None,
                email=user.email,
            )
        return user


class UserManagementSerializer(serializers.ModelSerializer):
    """Admin edita usuário existente. Senha opcional (reset provisório)."""
    new_password = serializers.CharField(
        write_only=True, required=False, allow_blank=True, min_length=8
    )

    class Meta:
        model = CustomUser
        fields = ["id", "email", "nome", "role", "is_active", "must_change_password", "date_joined", "new_password"]
        read_only_fields = ["id", "date_joined"]

    def validate(self, attrs):
        request = self.context.get("request")
        if request and self.instance == request.user:
            if "role" in attrs and attrs["role"] != self.instance.role:
                raise serializers.ValidationError({"role": "Você não pode alterar seu próprio perfil."})
            if "is_active" in attrs and attrs["is_active"] is False:
                raise serializers.ValidationError({"is_active": "Você não pode desativar sua própria conta."})
        return attrs

    def update(self, instance, validated_data):
        new_password = validated_data.pop("new_password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if new_password:
            instance.set_password(new_password)
            instance.must_change_password = True
        instance.save()
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
