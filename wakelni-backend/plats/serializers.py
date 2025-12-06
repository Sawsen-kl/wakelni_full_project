# plats/serializers.py
from rest_framework import serializers
from .models import Plat


class PlatSerializer(serializers.ModelSerializer):
    # username du cuisinier
    cuisinier = serializers.ReadOnlyField(source='cuisinier.username')

    # on reçoit le fichier dans "photo"
    photo = serializers.ImageField(
        required=False,
        allow_null=True,
        write_only=True
    )

    # et on renvoie une URL publique "photo_url"
    photo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Plat
        fields = [
            'id',
            'nom',
            'description',
            'ingredients',
            'prix',
            'stock',
            'ville',
            'adresse',
            'est_actif',
            'tags',
            'photo',       # fichier en entrée
            'photo_url',   # URL en sortie
            'cuisinier',
            'cree_le',
        ]
        read_only_fields = ('cuisinier', 'cree_le', 'photo_url')

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and hasattr(obj.photo, 'url'):
            url = obj.photo.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None
