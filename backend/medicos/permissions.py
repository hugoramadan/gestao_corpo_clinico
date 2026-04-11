from rest_framework.permissions import BasePermission


class IsGestorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("gestor", "admin")


class IsAdminOnly(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsMedicoOwnerOrStaff(BasePermission):
    """
    Médico acessa apenas o próprio registro.
    Gestor e Admin acessam qualquer registro.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role in ("gestor", "admin"):
            return True
        # obj é um Medico — verifica se o user logado é o dono
        return obj.user == request.user
