from rest_framework import serializers
from commandes.models import Commande
from .models import Reclamation, MotifReclamation, StatutReclamation


class ReclamationCreateSerializer(serializers.ModelSerializer):
    commande_id = serializers.CharField(write_only=True)

    class Meta:
        model = Reclamation
        fields = ["id", "commande_id", "motif", "description", "statut", "date"]
        read_only_fields = ["id", "statut", "date"]

    def validate_commande_id(self, value):
        user = self.context["request"].user

        try:
            commande = Commande.objects.get(pk=value, client=user)
        except (Commande.DoesNotExist, ValueError):
            raise serializers.ValidationError("Commande invalide.")

        return commande

    def create(self, validated_data):
        commande = validated_data.pop("commande_id")
        user = self.context["request"].user

        # 🔎 Récupérer un plat + cuisinier à partir des lignes de la commande
        # Ajuste "lignes" si ton related_name est différent
        ligne = (
            commande.lignes
            .select_related("plat__cuisinier")
            .first()
        )

        plat = ligne.plat if ligne else None
        cuisinier = plat.cuisinier if plat else None

        # 🔒 Empêcher une 2e réclamation pour la même commande / plat
        if Reclamation.objects.filter(
            client=user,
            commande=commande,
            plat=plat,
        ).exists():
            raise serializers.ValidationError(
                {
                    "non_field_errors": [
                        "Vous avez déjà envoyé une réclamation pour cette commande."
                    ]
                }
            )

        return Reclamation.objects.create(
            commande=commande,
            plat=plat,
            client=user,
            cuisinier=cuisinier,
            motif=validated_data["motif"],
            description=validated_data.get("description", ""),
        )

class ReclamationListSerializer(serializers.ModelSerializer):
    commande_id = serializers.CharField(source="commande.id", read_only=True)
    commande_label = serializers.SerializerMethodField()
    motif_label = serializers.CharField(source="get_motif_display", read_only=True)
    statut_label = serializers.CharField(source="get_statut_display", read_only=True)

    class Meta:
        model = Reclamation
        fields = [
            "id",
            "commande_id",
            "commande_label",
            "motif",
            "motif_label",
            "description",
            "statut",
            "statut_label",
            "date",
        ]

    def get_commande_label(self, obj):
        # adapte si tu as un champ numero / reference
        return f"Commande #{obj.commande.id}"
    

class ReclamationCuisinierSerializer(serializers.ModelSerializer):
    client_email = serializers.EmailField(source="client.email", read_only=True)
    client_name = serializers.SerializerMethodField()
    commande_label = serializers.SerializerMethodField()
    plat_nom = serializers.CharField(source="plat.nom", read_only=True)
    motif_label = serializers.CharField(source="get_motif_display", read_only=True)
    statut_label = serializers.CharField(source="get_statut_display", read_only=True)

    class Meta:
        model = Reclamation
        fields = [
            "id",
            "client_email",
            "client_name",
            "commande_label",
            "plat_nom",
            "motif",
            "motif_label",
            "description",
            "statut",
            "statut_label",
            "date",
        ]

    def get_client_name(self, obj):
        first = (obj.client.first_name or "").strip()
        last = (obj.client.last_name or "").strip()
        full = (first + " " + last).strip()
        return full or obj.client.email

    def get_commande_label(self, obj):
        # adapte si tu as un champ "numero" sur Commande
        return f"Commande #{obj.commande.id}"
