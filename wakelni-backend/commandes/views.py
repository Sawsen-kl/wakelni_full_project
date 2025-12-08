# commandes/views.py
from django.db.models import Q
from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import Commande
from notifications_app.models import Notification
from .serializers import CommandeSerializer, CommandeClientSerializer


class MesCommandesClientView(generics.ListAPIView):
    """
    GET /api/commandes/mes-commandes/

    - si user.role == "CLIENT"    -> commandes dont il est le client
    - si user.role == "CUISINIER" -> commandes contenant au moins un de ses plats
    """
    serializer_class = CommandeClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)

        qs = Commande.objects.all()

        if role == "CLIENT":
            qs = qs.filter(client=user)

        elif role == "CUISINIER":
            qs = qs.filter(lignes__plat__cuisinier=user).distinct()

        else:
            qs = Commande.objects.none()

        return qs.prefetch_related("lignes__plat").order_by("-created_at")


class CommandeViewSet(viewsets.ModelViewSet):
    """
    - CLIENT    : voit ses commandes (via MesCommandesClientView)
    - CUISINIER : voit ses commandes (via MesCommandesClientView)
    Ce ViewSet sert aux actions comme changer_statut / annuler / confirmer-reception.
    """
    serializer_class = CommandeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)

        if role == "CLIENT":
            return Commande.objects.filter(client=user).order_by("-created_at")

        if role == "CUISINIER":
            return (
                Commande.objects.filter(lignes__plat__cuisinier=user)
                .distinct()
                .order_by("-created_at")
            )

        return Commande.objects.none()

    # ---------- Action cuisinier : changer le statut ----------
    @action(detail=True, methods=["patch"], url_path="changer-statut")
    def changer_statut(self, request, pk=None):
        commande = self.get_object()
        user = request.user

        if getattr(user, "role", None) != "CUISINIER":
            return Response(
                {"detail": "Seul le cuisinier peut changer le statut."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not commande.lignes.filter(plat__cuisinier=user).exists():
            return Response(
                {"detail": "Cette commande ne contient pas vos plats."},
                status=status.HTTP_403_FORBIDDEN,
            )

        nouveau_statut = request.data.get("statut")

        if nouveau_statut not in dict(Commande.STATUT_CHOICES):
            return Response(
                {"detail": "Statut invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        commande.statut = nouveau_statut
        commande.save()

        # notification envoyée au CLIENT
        Notification.objects.create(
            destinataire=commande.client,
            message=(
                f"Le statut de votre commande #{commande.id} est maintenant : "
                f"{commande.get_statut_display()}."
            ),
        )

        data = CommandeClientSerializer(
            commande, context={"request": request}
        ).data
        return Response(data, status=status.HTTP_200_OK)

    # ---------- Action client : annuler une commande EN_ATTENTE ----------
    @action(detail=True, methods=["post"], url_path="annuler")
    def annuler_commande(self, request, pk=None):
        commande = self.get_object()
        user = request.user

        if getattr(user, "role", None) != "CLIENT" or commande.client != user:
            return Response(
                {"detail": "Vous ne pouvez annuler que vos propres commandes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if commande.statut != Commande.STATUT_EN_ATTENTE:
            return Response(
                {"detail": "Seules les commandes en attente peuvent être annulées."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        commande.statut = Commande.STATUT_ANNULEE
        commande.save()

        premiere_ligne = commande.lignes.select_related("plat__cuisinier").first()
        if premiere_ligne and hasattr(premiere_ligne.plat, "cuisinier"):
            Notification.objects.create(
                destinataire=premiere_ligne.plat.cuisinier,
                message=(
                    f"Le client {user.username} a annulé la commande "
                    f"#{commande.id}."
                ),
            )

        data = CommandeClientSerializer(
            commande, context={"request": request}
        ).data
        return Response(data, status=status.HTTP_200_OK)

    # ---------- Action client : confirmer réception (REMIS → COMPLETEE) ----------
    @action(detail=True, methods=["post"], url_path="confirmer-reception")
    def confirmer_reception(self, request, pk=None):
        commande = self.get_object()
        user = request.user

        if getattr(user, "role", None) != "CLIENT" or commande.client != user:
            return Response(
                {"detail": "Vous ne pouvez confirmer que vos propres commandes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if commande.statut != Commande.STATUT_REMIS:
            return Response(
                {"detail": "La commande doit être au statut 'REMIS' pour être confirmée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        commande.statut = Commande.STATUT_COMPLETEE
        commande.save()

        premiere_ligne = commande.lignes.select_related("plat__cuisinier").first()
        if premiere_ligne and hasattr(premiere_ligne.plat, "cuisinier"):
            Notification.objects.create(
                destinataire=premiere_ligne.plat.cuisinier,
                message=(
                    f"Le client {user.username} a confirmé la réception de "
                    f"la commande #{commande.id}."
                ),
            )

        data = CommandeClientSerializer(
            commande, context={"request": request}
        ).data
        return Response(data, status=status.HTTP_200_OK)
