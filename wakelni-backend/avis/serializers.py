# avis/serializers.py
from rest_framework import serializers
from .models import Avis

class AvisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avis
        fields = ["id", "note", "commentaire", "date", "client", "plat"]

class AvisCuisinierSerializer(serializers.ModelSerializer):
    client_email = serializers.EmailField(source="client.email")
    client_nom = serializers.CharField(source="client.get_full_name", read_only=True)
    plat_nom = serializers.CharField(source="plat.nom")

    class Meta:
        model = Avis
        fields = [
            "id",
            "note",
            "commentaire",
            "date",
            "client_email",
            "client_nom",
            "plat_nom",
        ]
