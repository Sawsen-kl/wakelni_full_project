
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Commande
from .serializers import CommandeSerializer
from notifications_app.models import Notification

class CommandeViewSet(viewsets.ModelViewSet):
    serializer_class = CommandeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CLIENT':
            return Commande.objects.filter(client=user)
        elif user.role == 'CUISINIER':
            return Commande.objects.filter(cuisinier=user)
        return Commande.objects.none()

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def confirmer_reception(self, request, pk=None):
        commande = self.get_object()
        commande.statut = Commande.Statut.REMIS
        commande.save()

        Notification.objects.create(
            destinataire=commande.cuisinier,
            message=f"Le client {commande.client.username} a confirmé la réception de la commande #{commande.id}."
        )

        return Response({'detail': 'Commande confirmée comme remise.'})
