from rest_framework import status, generics, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Medico, Especialidade, MedicoEspecialidade
from .serializers import (
    MedicoSerializer,
    MedicoListSerializer,
    EspecialidadeSerializer,
    MedicoEspecialidadeSerializer,
)
from .permissions import IsGestorOrAdmin, IsAdminOnly, IsMedicoOwnerOrStaff


class MedicoListCreateView(generics.ListCreateAPIView):
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nome_completo", "cpf", "crm_numero", "email"]
    ordering_fields = ["nome_completo", "created_at", "status"]
    ordering = ["nome_completo"]

    def get_queryset(self):
        qs = Medico.objects.select_related("user").prefetch_related("especialidades")
        status_param = self.request.query_params.get("status")
        if status_param:
            statuses = [s.strip() for s in status_param.split(",") if s.strip()]
            qs = qs.filter(status__in=statuses)
        return qs

    def get_serializer_class(self):
        if self.request.method == "GET":
            return MedicoListSerializer
        return MedicoSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated(), IsGestorOrAdmin()]
        # POST: qualquer usuário autenticado pode criar (médico cria o próprio cadastro)
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        # Se o criador é um médico, vincula automaticamente ao seu usuário
        if "medico" in (self.request.user.roles or []):
            serializer.save(user=self.request.user)
        else:
            serializer.save()


class MedicoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Medico.objects.select_related("user").prefetch_related(
        "especialidades", "comprovantes_especialidade__especialidade"
    )
    serializer_class = MedicoSerializer

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsAuthenticated(), IsAdminOnly()]
        return [IsAuthenticated(), IsMedicoOwnerOrStaff()]

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user is not None and instance.user == request.user:
            return Response(
                {"detail": "Você não pode excluir seu próprio cadastro médico."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if instance.status != "inativo":
            return Response(
                {"detail": "Apenas cadastros com status inativo podem ser excluídos."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        user = instance.user  # salva referência antes de deletar
        instance.delete()
        if user is not None:
            user.delete()  # remove o login junto com o cadastro


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def meu_cadastro_view(request):
    """Retorna o cadastro do médico logado."""
    try:
        medico = request.user.medico
        return Response(MedicoSerializer(medico).data)
    except Medico.DoesNotExist:
        return Response({"detail": "Cadastro médico não encontrado."}, status=status.HTTP_404_NOT_FOUND)


class ComprovantesListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicoEspecialidadeSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsMedicoOwnerOrStaff()]

    def get_medico(self):
        medico = generics.get_object_or_404(Medico, pk=self.kwargs["pk"])
        self.check_object_permissions(self.request, medico)
        return medico

    def get_queryset(self):
        return MedicoEspecialidade.objects.filter(medico__pk=self.kwargs["pk"]).select_related("especialidade")

    def perform_create(self, serializer):
        medico = self.get_medico()
        serializer.save(medico=medico)


class ComprovantesDestroyView(generics.DestroyAPIView):
    serializer_class = MedicoEspecialidadeSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsMedicoOwnerOrStaff()]

    def get_queryset(self):
        return MedicoEspecialidade.objects.filter(medico__pk=self.kwargs["pk"])

    def get_object(self):
        obj = generics.get_object_or_404(
            MedicoEspecialidade, pk=self.kwargs["cid"], medico__pk=self.kwargs["pk"]
        )
        # verifica permissão no médico pai
        self.check_object_permissions(self.request, obj.medico)
        return obj


class EspecialidadeListCreateView(generics.ListCreateAPIView):
    queryset = Especialidade.objects.all()
    serializer_class = EspecialidadeSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGestorOrAdmin()]
