from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).select_related('sender','message').order_by('-created_at')[:50]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'success': True, 'data': self.get_serializer(queryset, many=True, context={'request': request}).data, 'unread_count': unread_count})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_read(request, notification_id):
    try:
        n = Notification.objects.get(id=notification_id, recipient=request.user)
        n.mark_read()
        return Response({'success': True})
    except Notification.DoesNotExist:
        return Response({'success': False}, status=404)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_read(request):
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True, read_at=timezone.now())
    return Response({'success': True})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_count(request):
    return Response({'success': True, 'count': Notification.objects.filter(recipient=request.user, is_read=False).count()})