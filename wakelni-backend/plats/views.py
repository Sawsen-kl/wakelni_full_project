# plats/views.py
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Plat
from .serializers import PlatSerializer


class PlatListCreateView(generics.ListCreateAPIView):
    """
    GET /api/plats/        -> liste de tous les plats actifs (clients)
    POST /api/plats/       -> créer un plat (cuisinier connecté)
    """
    serializer_class = PlatSerializer
    queryset = Plat.objects.all()
    # ⬇️ important pour upload
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Plat.objects.filter(est_actif=True)

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, "role", None) != "CUISINIER":
            raise PermissionDenied("Seuls les cuisiniers peuvent créer des plats.")
        serializer.save(cuisinier=user)


class MesPlatsView(generics.ListAPIView):
    """
    GET /api/plats/mes-plats/
    """
    serializer_class = PlatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", None) != "CUISINIER":
            return Plat.objects.none()
        return Plat.objects.filter(cuisinier=user)


class PlatDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/plats/<uuid:id>/
    PUT/PATCH /api/plats/<uuid:id>/
    DELETE /api/plats/<uuid:id>/
    """
    serializer_class = PlatSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"
    queryset = Plat.objects.all()
    # pour pouvoir modifier aussi la photo plus tard
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        plat = super().get_object()
        user = self.request.user
        if getattr(user, "role", None) != "CUISINIER" or plat.cuisinier != user:
            raise PermissionDenied("Vous ne pouvez gérer que vos propres plats.")
        return plat
