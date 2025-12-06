
from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsCuisinierOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'CUISINIER'

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.cuisinier == request.user
