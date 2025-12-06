from django.contrib import admin
from .models import Commande, LigneCommande


@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    # On enlève cree_le, total, etc. pour le moment
    # On laisse Django gérer par défaut
    pass


@admin.register(LigneCommande)
class LigneCommandeAdmin(admin.ModelAdmin):
    pass
