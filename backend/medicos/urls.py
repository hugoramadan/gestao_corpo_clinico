from django.urls import path
from .views import (
    MedicoListCreateView,
    MedicoDetailView,
    meu_cadastro_view,
    ComprovantesListCreateView,
    ComprovantesDestroyView,
    EspecialidadeListCreateView,
)

urlpatterns = [
    path("", MedicoListCreateView.as_view(), name="medico-list-create"),
    path("me/", meu_cadastro_view, name="medico-me"),
    path("<int:pk>/", MedicoDetailView.as_view(), name="medico-detail"),
    path("<int:pk>/comprovantes/", ComprovantesListCreateView.as_view(), name="comprovante-list-create"),
    path("<int:pk>/comprovantes/<int:cid>/", ComprovantesDestroyView.as_view(), name="comprovante-destroy"),
    path("especialidades/", EspecialidadeListCreateView.as_view(), name="especialidade-list-create"),
]
