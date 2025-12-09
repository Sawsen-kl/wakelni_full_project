# reclamations/views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model

from .models import Reclamation, StatutReclamation
from .serializers import ReclamationCreateSerializer, ReclamationListSerializer
from .serializers import ReclamationCuisinierSerializer

User = get_user_model()


class CreerReclamationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReclamationCreateSerializer(
            data=request.data,
            context={"request": request}
        )

        if serializer.is_valid():
            reclamation = serializer.save()
            return Response(
                ReclamationListSerializer(reclamation).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MesReclamationsClientView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Reclamation.objects
            .filter(client=request.user)
            .select_related("commande")
            .order_by("-date")
        )
        serializer = ReclamationListSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ReclamationsRecuesCuisinierView(APIView):
    """
    GET /api/reclamations/cuisinier/
    -> liste des réclamations sur les plats du cuisinier connecté
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != User.Role.CUISINIER:
            return Response(
                {"detail": "Réservé aux cuisiniers."},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = (
            Reclamation.objects
            #  AU LIEU DE  .filter(plat__cuisinier=request.user)
            .filter(commande__lignes__plat__cuisinier=request.user)
            .select_related("client", "commande", "plat")
            .order_by("-date")
            .distinct()   # important pour éviter les doublons si plusieurs lignes
        )
        serializer = ReclamationCuisinierSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


    

class ChangerStatutReclamationView(APIView):
    """
    POST /api/reclamations/<uuid:pk>/changer-statut/
    body: { "statut": "LU" | "EN_COURS" | "TRAITEE" | "REJETEE" | "OUVERT" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != User.Role.CUISINIER:
            return Response(
                {"detail": "Réservé aux cuisiniers."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            reclamation = (
                Reclamation.objects
                .select_related("commande", "plat", "client")
                # 🔴 AU LIEU DE .get(pk=pk, plat__cuisinier=request.user)
                .get(pk=pk, commande__lignes__plat__cuisinier=request.user)
            )
        except Reclamation.DoesNotExist:
            return Response(
                {"detail": "Réclamation introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("statut")
        allowed = [choice[0] for choice in StatutReclamation.choices]

        if new_status not in allowed:
            return Response(
                {"detail": "Statut invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reclamation.statut = new_status
        reclamation.save()

        serializer = ReclamationCuisinierSerializer(reclamation)
        return Response(serializer.data, status=status.HTTP_200_OK)


