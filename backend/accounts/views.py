import logging

from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

from rest_framework import status, generics, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CustomUser
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserManagementSerializer,
    ChangePasswordSerializer,
)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {"message": "Cadastro realizado com sucesso.", "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.must_change_password = False
        user.save()
        return Response({"detail": "Senha alterada com sucesso."})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request_view(request):
    """Solicita recuperação de senha. Gera token e envia e-mail."""
    email = request.data.get("email", "").strip()
    if not email:
        return Response({"detail": "Informe o e-mail."}, status=status.HTTP_400_BAD_REQUEST)

    # Sempre retorna 200 para não expor quais e-mails existem
    try:
        user = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        return Response({"detail": "Se esse e-mail estiver cadastrado, você receberá as instruções."})

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    reset_url = f"{settings.FRONTEND_URL}/redefinir-senha?uid={uid}&token={token}"

    try:
        send_mail(
            subject="Recuperação de senha — Corpo Clínico",
            message=(
                f"Olá, {user.nome}!\n\n"
                f"Você solicitou a redefinição de senha. Clique no link abaixo:\n\n"
                f"{reset_url}\n\n"
                f"O link expira em 24 horas. Se não foi você, ignore este e-mail."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Falha ao enviar e-mail de recuperação de senha para %s", user.email)

    return Response({"detail": "Se esse e-mail estiver cadastrado, você receberá as instruções."})


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm_view(request):
    """Confirma o token e redefine a senha."""
    uid = request.data.get("uid", "")
    token = request.data.get("token", "")
    new_password = request.data.get("new_password", "")
    new_password_confirm = request.data.get("new_password_confirm", "")

    if not all([uid, token, new_password, new_password_confirm]):
        return Response({"detail": "Todos os campos são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

    if new_password != new_password_confirm:
        return Response({"new_password_confirm": ["As senhas não conferem."]}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({"new_password": ["A senha deve ter pelo menos 8 caracteres."]}, status=status.HTTP_400_BAD_REQUEST)

    try:
        pk = force_str(urlsafe_base64_decode(uid))
        user = CustomUser.objects.get(pk=pk)
    except (TypeError, ValueError, CustomUser.DoesNotExist):
        return Response({"detail": "Link inválido ou expirado."}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({"detail": "Link inválido ou expirado."}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    return Response({"detail": "Senha redefinida com sucesso."})


class UserListCreateView(generics.ListCreateAPIView):
    """Admin lista e cria usuários."""
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nome", "email"]
    ordering_fields = ["nome", "email", "date_joined"]

    def get_queryset(self):
        from django.db.models import Q
        qs = CustomUser.objects.prefetch_related(
            "medico", "funcionario"
        ).order_by("nome")
        status_param = self.request.query_params.get("status")
        if status_param:
            _valid = {"pendente", "ativo", "inativo"}
            statuses = [s.strip() for s in status_param.split(",") if s.strip() in _valid]
            if statuses:
                # "ativo" na lista de usuários inclui médicos com status "pendente"
                medico_statuses = list(statuses)
                if "ativo" in statuses and "pendente" not in medico_statuses:
                    medico_statuses.append("pendente")
                qs = qs.filter(
                    Q(medico__status__in=medico_statuses) | Q(funcionario__status__in=statuses)
                ).distinct()
        return qs

    def get_permissions(self):
        from medicos.permissions import IsAdminOnly, IsGestorOrAdmin
        if self.request.method == "POST":
            return [IsAuthenticated(), IsGestorOrAdmin()]
        return [IsAuthenticated(), IsAdminOnly()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin consulta, edita e exclui usuário."""
    queryset = CustomUser.objects.all()

    def get_permissions(self):
        from medicos.permissions import IsAdminOnly
        return [IsAuthenticated(), IsAdminOnly()]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserManagementSerializer
        return UserSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            return Response(
                {"detail": "Você não pode excluir sua própria conta."},
                status=status.HTTP_403_FORBIDDEN,
            )
        perfil_status = self._get_perfil_status(instance)
        if perfil_status != "inativo":
            return Response(
                {"detail": "Apenas usuários com status inativo podem ser excluídos."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Apaga o cadastro médico vinculado antes de apagar o usuário
        try:
            instance.medico.delete()
        except Exception:
            pass
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @staticmethod
    def _get_perfil_status(user):
        """Retorna 'ativo' ou 'inativo' baseado em is_active e Medico.status."""
        try:
            s = user.medico.status
            return "ativo" if s in ("ativo", "pendente") else "inativo"
        except Exception:
            pass
        return "ativo" if user.is_active else "inativo"
