# paiements/views.py
import stripe
from decimal import Decimal

from django.conf import settings
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from paniers.views import get_or_create_panier_courant
from commandes.models import Commande, LigneCommande
from notifications_app.models import Notification  # ✅ import de la notif

# ✅ IMPORTS POUR PAIEMENT
from .models import Paiement, StatutPaiement, TypePaiement

stripe.api_key = settings.STRIPE_SECRET_KEY


class CreateCheckoutSessionView(APIView):
    """
    1) Récupère le panier courant
    2) Crée une session Stripe Checkout
    3) Crée une Commande en statut EN_ATTENTE
    ⚠️ Ne diminue PAS le stock, ne vide PAS le panier.
    """
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

        # 4) Créer une commande en attente dans ta BDD
        Commande.objects.create(
            client=request.user,
            total=panier.total,      # propriété calculée
            stripe_session_id=session.id,
            statut="EN_ATTENTE",     # par défaut côté client
        )

        # 5) Retourner l’URL Stripe
        return Response({"url": session.url}, status=status.HTTP_200_OK)


class ConfirmPaymentView(APIView):
    """
    Appelée après le retour Stripe sur /client/paiement/success.

    - Vérifie auprès de Stripe que la session est bien payée
    - Passe la commande EN_ATTENTE -> (logique de ton app, ici EN_ATTENTE conservé)
    - Crée les lignes de commande à partir du panier
    - Diminue le stock
    - Vide le panier
    - ✅ Crée / met à jour un objet Paiement pour la commande

    Idempotent : si la commande est déjà confirmée, on ne refait rien.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        raw_session_id = request.data.get("session_id")
        if not raw_session_id:
            return Response(
                {"detail": "session_id manquant."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # on enlève d'éventuelles accolades { ... }
        session_id = str(raw_session_id).strip("{}")

        # 1) Vérifier la session Stripe
        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except Exception as e:
            return Response(
                {"detail": f"Impossible de récupérer la session Stripe : {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # On vérifie que le paiement est bien 'paid'
        if session.get("payment_status") != "paid":
            return Response(
                {"detail": "Le paiement n'est pas confirmé par Stripe."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2) Récupérer la commande liée à cette session
        try:
            commande = Commande.objects.get(
                stripe_session_id=session_id,
                client=request.user,
            )
        except Commande.DoesNotExist:
            return Response(
                {"detail": "Commande introuvable pour cette session."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Si la commande est déjà confirmée, on ne refait pas la logique panier/stock
        if commande.statut != "EN_ATTENTE":
            # ✅ Mais on renvoie quand même des infos de paiement/facture si le Paiement existe
            paiement = Paiement.objects.filter(commande=commande).first()
            if paiement:
                return Response(
                    {
                        "detail": "Commande déjà confirmée.",
                        "commande_id": commande.id,
                        "montant": str(paiement.montant),
                        "date": paiement.date.isoformat(),
                        "statut": paiement.statut,
                        "type": paiement.type,
                        "transaction_ref": paiement.transaction_ref,
                    },
                    status=status.HTTP_200_OK,
                )
            # fallback : ancien comportement
            return Response(
                {"detail": "Commande déjà confirmée."},
                status=status.HTTP_200_OK,
            )

        # 3) Récupérer le panier courant
        panier = get_or_create_panier_courant(request.user)

        # 4) Créer les lignes de commande et diminuer le stock
        for ligne in panier.lignes.select_related("plat"):
            plat = ligne.plat

            # créer la ligne de commande
            LigneCommande.objects.create(
                commande=commande,
                plat=plat,
                quantite=ligne.quantite,
                sous_total=ligne.sous_total,
            )

            # diminuer le stock si présent
            if hasattr(plat, "stock") and plat.stock is not None:
                plat.stock = max(0, plat.stock - ligne.quantite)
                plat.save()

        # 5) Vider le panier
        panier.lignes.all().delete()

        # 6) Mettre la commande en préparation (ou EN_ATTENTE selon ta logique)
        # NOTE : dans ton commentaire tu mentionnes EN_PREPARATION, mais ici
        # je laisse EN_ATTENTE pour ne pas casser ton code existant.
        commande.statut = "EN_ATTENTE"
        commande.save()

        # 7) Créer une notification pour le cuisinier (première ligne)
        premiere_ligne = commande.lignes.select_related("plat__cuisinier").first()
        if premiere_ligne and hasattr(premiere_ligne.plat, "cuisinier"):
            Notification.objects.create(
                destinataire=premiere_ligne.plat.cuisinier,
                message=(
                    f"Nouvelle commande payée #{commande.id} "
                    f"pour votre plat {premiere_ligne.plat.nom}."
                ),
            )

        # 8) ✅ Créer ou mettre à jour le Paiement lié à la commande
        # On suppose que Commande.total contient le montant final
        paiement, created = Paiement.objects.get_or_create(
            commande=commande,
            defaults={
                "montant": commande.total,
                "statut": StatutPaiement.SUCCES,
                "type": TypePaiement.CARTE_CREDIT,  # ici on force "carte", tu pourras raffiner
                "transaction_ref": session.get("payment_intent", "") or "",
            },
        )

        if not created:
            # Si le paiement existait déjà, on met à jour au cas où
            paiement.statut = StatutPaiement.SUCCES
            if not paiement.transaction_ref:
                paiement.transaction_ref = session.get("payment_intent", "") or paiement.transaction_ref
            paiement.save()

        # 9) Réponse finale (compatible avec ton frontend actuel + infos facture)
        return Response(
            {
                "detail": "Paiement confirmé, commande en préparation.",
                "commande_id": commande.id,
                "montant": str(paiement.montant),
                "date": paiement.date.isoformat(),
                "statut": paiement.statut,
                "type": paiement.type,
                "transaction_ref": paiement.transaction_ref,
            },
            status=status.HTTP_200_OK,
        )
