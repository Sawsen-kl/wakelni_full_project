# avis/views.py
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import Avis
from .serializers import AvisSerializer, AvisCuisinierSerializer
from plats.models import Plat
from commandes.models import Commande

User = get_user_model()


class LaisserAvisView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        plat_id = request.data.get("plat")
        note = request.data.get("note")
        commentaire = request.data.get("commentaire", "")

        if not plat_id or not note:
            return Response(
                {"detail": "plat et note sont obligatoires."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            plat = Plat.objects.get(pk=plat_id, est_actif=True)
        except Plat.DoesNotExist:
            return Response(
                {"detail": "Plat introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ✅ Vérifier que l'utilisateur a bien commandé ce plat
        a_commande_ce_plat = Commande.objects.filter(
            client=user,
            statut__in=["REMIS", "COMPLETEE"],
            lignes__plat=plat,
        ).exists()

        if not a_commande_ce_plat:
            return Response(
                {
                    "detail": (
                        "Vous ne pouvez noter que les plats que vous avez déjà commandés."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        avis, created = Avis.objects.get_or_create(
            client=user,
            plat=plat,
            defaults={"note": note, "commentaire": commentaire},
        )
        if not created:
            avis.note = note
            avis.commentaire = commentaire
            avis.save()

        serializer = AvisSerializer(avis)
        return Response(serializer.data, status=status.HTTP_201_CREATED)



class MonAvisView(APIView):
    """
    GET /api/avis/mon-avis/?plat_id=...
    Renvoie l'avis du user connecté pour un plat précis.
    Utilisé par AvisForm pour préremplir / bloquer le formulaire.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        plat_id = request.query_params.get("plat_id")
        if not plat_id:
            return Response(
                {"detail": "Paramètre 'plat_id' manquant."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            avis = Avis.objects.get(client=user, plat_id=plat_id)
        except Avis.DoesNotExist:
            # 404 = pas d'avis → ton front le gère déjà en catch
            return Response(
                {"detail": "Aucun avis trouvé pour ce plat."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AvisSerializer(avis)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AvisParPlatView(APIView):
    """
    GET /api/avis/avis-par-plat/?plat_id=...
    Liste tous les avis d'un plat (pour la colonne "avis des autres clients"
    dans ta modale côté client).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        plat_id = request.query_params.get("plat_id")
        if not plat_id:
            return Response(
                {"detail": "Paramètre 'plat_id' manquant."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        avis_qs = (
            Avis.objects
            .filter(plat_id=plat_id)
            .select_related("client")
            .order_by("-date")
        )

        serializer = AvisCuisinierSerializer(avis_qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AvisRecusCuisinierView(APIView):
    """
    GET /api/avis/avis-cuisinier/
    Liste tous les avis sur les plats du cuisinier connecté.
    Utilisé par la page /cuisinier/avis.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != User.Role.CUISINIER:
            return Response(
                {"detail": "Réservé aux cuisiniers."},
                status=status.HTTP_403_FORBIDDEN,
            )

        avis_qs = (
            Avis.objects
            .filter(plat__cuisinier=request.user)
            .select_related("client", "plat")
            .order_by("-date")
        )

        serializer = AvisCuisinierSerializer(avis_qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
