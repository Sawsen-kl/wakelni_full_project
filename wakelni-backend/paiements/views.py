# paiements/views.py
import stripe
from decimal import Decimal

from django.conf import settings
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from paniers.views import get_or_create_panier_courant
from commandes.models import Commande, LigneCommande

stripe.api_key = settings.STRIPE_SECRET_KEY


class CreateCheckoutSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # 1) Récupérer le panier du client
        panier = get_or_create_panier_courant(request.user)

        if not panier.lignes.exists():
            return Response(
                {"detail": "Votre panier est vide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2) Construire les line_items pour Stripe
        line_items = []
        for ligne in panier.lignes.select_related("plat"):
            plat = ligne.plat
            unit_amount = int(Decimal(plat.prix) * 100)  # prix en cents

            line_items.append(
                {
                    "price_data": {
                        "currency": "cad",
                        "unit_amount": unit_amount,
                        "product_data": {
                            "name": plat.nom,
                        },
                    },
                    "quantity": ligne.quantite,
                    # IMPORTANT : on ne met plus adjustable_quantity pour éviter l'erreur min/max
                }
            )

        # 3) Créer la session Stripe Checkout
        FRONT_URL = "http://localhost:3000"

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=line_items,
            success_url=(
                f"{FRONT_URL}/client/paiement/success"
                "?session_id={{CHECKOUT_SESSION_ID}}"
            ),
            cancel_url=f"{FRONT_URL}/client/panier",
        )

        # 4) Créer une commande dans ta BDD
        commande = Commande.objects.create(
            client=request.user,
            total=panier.total,
            stripe_session_id=session.id,
            statut="EN_PREPARATION",
        )

        for ligne in panier.lignes.select_related("plat"):
            LigneCommande.objects.create(
                commande=commande,
                plat=ligne.plat,
                quantite=ligne.quantite,
                sous_total=ligne.sous_total,
            )

        # 5) Vider le panier
        panier.lignes.all().delete()
        #panier.total = 0
        #panier.save()

        # 6) Retourner l’URL Stripe
        return Response({"url": session.url}, status=status.HTTP_200_OK)
