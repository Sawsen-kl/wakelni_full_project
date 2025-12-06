from django.contrib import admin
from .models import Plat, Avis


@admin.register(Plat)
class PlatAdmin(admin.ModelAdmin):
    # On ne met rien de spécial pour l’instant
    # (pas de list_display, list_filter, etc.)
    pass


@admin.register(Avis)
class AvisAdmin(admin.ModelAdmin):
    # Idem, config minimale pour ne pas casser les checks
    pass
