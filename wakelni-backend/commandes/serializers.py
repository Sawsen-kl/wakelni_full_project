
from rest_framework import serializers
from .models import Commande, LigneCommande
from plats.models import Plat
from notifications_app.models import Notification

class LigneCommandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneCommande
        fields = ('plat', 'quantite')


class CommandeSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeSerializer(many=True)
    client = serializers.ReadOnlyField(source='client.username')
    cuisinier = serializers.ReadOnlyField(source='cuisinier.username')

    class Meta:
        model = Commande
        fields = ('id', 'client', 'cuisinier', 'statut', 'total', 'lignes', 'cree_le')
        read_only_fields = ('total', 'cree_le', 'statut')

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        client = self.context['request'].user

        premier_plat = lignes_data[0]['plat']
        cuisinier = premier_plat.cuisinier

        commande = Commande.objects.create(
            client=client,
            cuisinier=cuisinier,
        )

        total = 0
        for ligne in lignes_data:
            plat = ligne['plat']
            quantite = ligne['quantite']

            if plat.quantite_disponible < quantite:
                raise serializers.ValidationError(
                    f"Stock insuffisant pour le plat {plat.titre}"
                )

            plat.quantite_disponible -= quantite
            plat.save()

            lc = LigneCommande.objects.create(
                commande=commande,
                plat=plat,
                quantite=quantite,
                prix_unitaire=plat.prix,
            )
            total += lc.sous_total()

        commande.total = total
        commande.save()

        Notification.objects.create(
            destinataire=cuisinier,
            message=f"Nouvelle commande #{commande.id} de {client.username}",
        )

        return commande
