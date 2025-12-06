import uuid
from django.db import models
from commandes.models import Commande


class StatutPaiement(models.TextChoices):
    EN_ATTENTE = "EN_ATTENTE", "En attente"
    SUCCES = "SUCCES", "Succès"
    ECHEC = "ECHEC", "Échec"
    REMBOURSE = "REMBOURSE", "Remboursé"


class TypePaiement(models.TextChoices):
    CARTE_CREDIT = "CARTE_CREDIT", "Carte de crédit"
    CARTE_DEBIT = "CARTE_DEBIT", "Carte de débit"
    PAYPAL = "PAYPAL", "PayPal"
    APPLE_PAY = "APPLE_PAY", "Apple Pay"


class Paiement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commande = models.OneToOneField(
        Commande, on_delete=models.CASCADE, related_name="paiement"
    )
    montant = models.DecimalField(max_digits=8, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(
        max_length=20, choices=StatutPaiement.choices, default=StatutPaiement.EN_ATTENTE
    )
    type = models.CharField(
        max_length=20, choices=TypePaiement.choices, default=TypePaiement.CARTE_CREDIT
    )
    transaction_ref = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Paiement {self.montant}$ pour cmd {self.commande.id} ({self.statut})"
