from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import models
from .serializers import (RegisterSerializer, LoginSerializer, UserSerializer,
                          UpdateProfileSerializer, ChangePasswordSerializer, UserPublicSerializer)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'data': {
                'user': UserSerializer(user, context={'request': request}).data,
                'tokens': {'access': str(refresh.access_token), 'refresh': str(refresh)}
            }
        }, status=status.HTTP_201_CREATED)

class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        return Response({
            'success': True,
            'message': 'Logged in successfully.',
            'data': {
                'user': data['user'],
                'tokens': {'access': data['access'], 'refresh': data['refresh']}
            }
        })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()
    except Exception:
        pass
    return Response({'success': True, 'message': 'Logged out.'})

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UpdateProfileSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    if not request.user.check_password(serializer.validated_data['old_password']):
        return Response({'success': False, 'error': {'message': 'Current password is incorrect.'}}, status=400)
    request.user.set_password(serializer.validated_data['new_password'])
    request.user.save()
    return Response({'success': True, 'message': 'Password changed.'})

@api_view(['GET'])
@permission_classes([AllowAny])
def check_username(request):
    username = request.query_params.get('username', '').lower()
    return Response({'available': not User.objects.filter(username=username).exists()})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    q = request.query_params.get('q', '')
    if len(q) < 2:
        return Response({'success': True, 'data': []})
    users = User.objects.filter(is_active=True).filter(
        models.Q(username__icontains=q) | models.Q(display_name__icontains=q) | models.Q(email__icontains=q)
    ).exclude(id=request.user.id)[:10]
    return Response({'success': True, 'data': UserPublicSerializer(users, many=True, context={'request': request}).data})