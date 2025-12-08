# users/views.py
from django.contrib.auth import authenticate, get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken  # JWT
from rest_framework.permissions import IsAuthenticated
from .serializers import ClientProfileSerializer

from .serializers import (
    UserSerializer,
    ClerkSyncSerializer,
    RegisterSerializer,
)

User = get_user_model()


class ClerkSyncView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ClerkSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        clerk_id = data["clerk_id"]
        email = data["email"]
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        avatar_url = data.get("avatar_url")
        role = data.get("role", User.Role.CLIENT)

        user, created = User.objects.get_or_create(
            clerk_id=clerk_id,
            defaults={
                "username": email,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "avatar_url": avatar_url,
                "role": role,
            },
        )

        updated = False
        if user.email != email:
            user.email = email
            updated = True
        if user.first_name != first_name:
            user.first_name = first_name
            updated = True
        if user.last_name != last_name:
            user.last_name = last_name
            updated = True
        if avatar_url and user.avatar_url != avatar_url:
            user.avatar_url = avatar_url
            updated = True

        if updated:
            user.save()

        return Response(
            {"user": UserSerializer(user).data, "created": created},
            status=status.HTTP_200_OK,
        )


class RegisterView(APIView):
    """
    Inscription classique (client / cuisinier) utilisée par tes formulaires Next.js.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    Connexion avec 'identifier' (email OU username) + 'password'.
    Retourne des tokens JWT + les infos de l'utilisateur.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get("identifier", "")
        password = request.data.get("password", "")

        if not identifier or not password:
            return Response(
                {"detail": "identifier et password sont requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # On essaie d'abord de trouver par email
        try:
            user_obj = User.objects.get(email=identifier)
            username = user_obj.username
        except User.DoesNotExist:
            # Sinon on suppose que c'est déjà un username
            username = identifier

        user = authenticate(request, username=username, password=password)

        if user is None:
            return Response(
                {"detail": "Identifiants invalides."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )
    

class ClientMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ClientProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = ClientProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
