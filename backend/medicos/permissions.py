from rest_framework.permissions import BasePermission


def _has_role(user, *roles):
    return bool(set(user.roles or []) & set(roles))


class IsGestorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and _has_role(request.user, "gestor", "admin")


class IsAdminOnly(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and _has_role(request.user, "admin")


class IsMedicoOwnerOrStaff(BasePermission):
    """
    Médico acessa apenas o próprio registro.
    Gestor e Admin acessam qualquer registro.
    """
    def has_object_permission(self, request, view, obj):
        if _has_role(request.user, "gestor", "admin"):
            return True
        # obj é um Medico — verifica se o user logado é o dono
        return obj.user == request.user
