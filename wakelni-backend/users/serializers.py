from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "clerk_id",
            "avatar_url",
            "adresse_principale",
            "preferences",
            "bio",
            "adresse",
            "note_moyenne",
            "actif",
        ]


class ClerkSyncSerializer(serializers.Serializer):
    clerk_id = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField(required=False, allow_blank=True, default="")
    last_name = serializers.CharField(required=False, allow_blank=True, default="")
    avatar_url = serializers.URLField(required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=User.Role.choices, required=False, default=User.Role.CLIENT
    )


# 🔴 AJOUTER CECI :
class RegisterSerializer(serializers.ModelSerializer):
    # mot de passe en écriture seule
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "role",
            "avatar_url",
            "adresse_principale",
            "preferences",
            "bio",
            "adresse",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)  # hash du mot de passe
        user.save()
        return user
