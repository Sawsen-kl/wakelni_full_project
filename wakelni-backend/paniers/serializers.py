# paniers/serializers.py
from rest_framework import serializers
from .models import Panier, LignePanier
from plats.serializers import PlatSerializer   # 👈 important


class LignePanierSerializer(serializers.ModelSerializer):
    plat_nom = serializers.ReadOnlyField(source="plat.nom")
    # on va récupérer la même photo_url que dans PlatSerializer
    plat_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = LignePanier
        fields = [
            "id",
            "plat",            # id du plat
            "plat_nom",
            "plat_photo_url",  # 👈 nouveau champ
            "quantite",
            "prix_unitaire",
            "remarques",
            "sous_total",
        ]

    def get_plat_photo_url(self, obj):
        """
        On réutilise PlatSerializer pour avoir exactement la même URL
        que sur /api/plats/ (là où les images fonctionnent déjà).
        """
        request = self.context.get("request")
        plat_data = PlatSerializer(obj.plat, context={"request": request}).data
        return plat_data.get("photo_url")


class PanierSerializer(serializers.ModelSerializer):
    lignes = LignePanierSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = Panier
        fields = [
            "id",
            "client",
            "created_at",
            "updated_at",
            "lignes",
            "total",
        ]
        read_only_fields = ("client", "created_at", "updated_at", "total")
