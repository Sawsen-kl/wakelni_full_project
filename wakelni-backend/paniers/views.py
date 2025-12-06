# paniers/views.py
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied

from .models import Panier, LignePanier
from .serializers import PanierSerializer
from plats.models import Plat


def get_or_create_panier_courant(user):
    """
    Retourne le panier courant du client, en le créant si nécessaire.
    """
    if getattr(user, "role", None) != "CLIENT":
        raise PermissionDenied("Seuls les clients peuvent utiliser le panier.")
    panier, _created = Panier.objects.get_or_create(client=user)
    return panier


class MonPanierView(APIView):
    """
    GET /api/paniers/mon-panier/
    -> Renvoie le panier courant du client (créé s'il n'existe pas).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        panier = get_or_create_panier_courant(request.user)
        # 🔴 important : on passe le request dans le context
        serializer = PanierSerializer(panier, context={"request": request})
        return Response(serializer.data)


class AjouterAuPanierView(APIView):
    """
    POST /api/paniers/ajouter/
    body: { "plat_id": "<uuid>", "quantite": 1 }
    -> Ajoute (ou augmente) un plat dans le panier courant.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        panier = get_or_create_panier_courant(user)

        plat_id = request.data.get("plat_id")
        quantite = request.data.get("quantite", 1)

        try:
            quantite = int(quantite)
        except (TypeError, ValueError):
            raise ValidationError({"quantite": "La quantité doit être un entier."})

        if quantite <= 0:
            raise ValidationError({"quantite": "La quantité doit être > 0."})

        try:
            plat = Plat.objects.get(id=plat_id, est_actif=True)
        except Plat.DoesNotExist:
            raise ValidationError({"plat_id": "Plat introuvable ou inactif."})

        if plat.stock <= 0:
            raise ValidationError({"plat_id": "Ce plat est en rupture de stock."})

        # on vérifie qu'on ne dépasse pas le stock
        item, created = LignePanier.objects.get_or_create(
            panier=panier,
            plat=plat,
            defaults={"quantite": 0, "prix_unitaire": plat.prix},
        )

        nouvelle_quantite = item.quantite + quantite
        if nouvelle_quantite > plat.stock:
            raise ValidationError(
                {"quantite": "Quantité demandée supérieure au stock disponible."}
            )

        item.quantite = nouvelle_quantite
        item.save()

        serializer = PanierSerializer(panier, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class MettreAJourItemView(APIView):
    """
    PATCH /api/paniers/item/<uuid:item_id>/
    body: { "quantite": 3 }
    -> Modifie la quantité d'un item (0 -> supprime).
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, item_id):
        panier = get_or_create_panier_courant(request.user)

        try:
            item = LignePanier.objects.select_related("plat", "panier").get(
                id=item_id, panier=panier
            )
        except LignePanier.DoesNotExist:
            raise ValidationError({"item": "Élément de panier introuvable."})

        quantite = request.data.get("quantite")
        try:
            quantite = int(quantite)
        except (TypeError, ValueError):
            raise ValidationError({"quantite": "La quantité doit être un entier."})

        if quantite <= 0:
            # on supprime la ligne
            item.delete()
        else:
            if quantite > item.plat.stock:
                raise ValidationError(
                    {"quantite": "Quantité demandée supérieure au stock disponible."}
                )
            item.quantite = quantite
            item.save()

        serializer = PanierSerializer(panier, context={"request": request})
        return Response(serializer.data)


class SupprimerItemView(APIView):
    """
    DELETE /api/paniers/item/<uuid:item_id>/
    -> Supprime une ligne du panier.
    """

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, item_id):
        panier = get_or_create_panier_courant(request.user)

        try:
            item = LignePanier.objects.get(id=item_id, panier=panier)
        except LignePanier.DoesNotExist:
            raise ValidationError({"item": "Élément de panier introuvable."})

        item.delete()

        serializer = PanierSerializer(panier, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
