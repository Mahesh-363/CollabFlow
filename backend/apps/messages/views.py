import re
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import CursorPagination
from django.shortcuts import get_object_or_404
from apps.channels.models import Channel, ChannelMember
from .models import Message, MessageReaction, MessageMention
from .serializers import MessageSerializer, CreateMessageSerializer

class MessageCursorPagination(CursorPagination):
    page_size = 50
    ordering = '-created_at'

class ChannelMessagesView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer
    pagination_class = MessageCursorPagination

    def get_queryset(self):
        channel = get_object_or_404(Channel, id=self.kwargs['channel_id'])
        get_object_or_404(ChannelMember, channel=channel, user=self.request.user, is_active=True)
        return Message.objects.filter(channel=channel, parent=None).select_related('sender').prefetch_related('reactions__user','thread_replies').order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            messages = list(reversed(page))
            serializer = self.get_serializer(messages, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response({'success': True, 'data': serializer.data})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_message(request, channel_id):
    channel = get_object_or_404(Channel, id=channel_id)
    get_object_or_404(ChannelMember, channel=channel, user=request.user, is_active=True)
    serializer = CreateMessageSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    message = Message.objects.create(channel=channel, sender=request.user, **serializer.validated_data)
    mentioned_usernames = re.findall(r'@(\w+)', message.content)
    if mentioned_usernames:
        from apps.accounts.models import User
        from apps.notifications.models import Notification
        for username in set(mentioned_usernames):
            try:
                mentioned_user = User.objects.get(username=username)
                if mentioned_user != request.user:
                    MessageMention.objects.create(message=message, mentioned_user=mentioned_user)
                    Notification.objects.create(recipient=mentioned_user, sender=request.user, notification_type='mention', message=message, workspace=channel.workspace, title=f'{request.user.name} mentioned you', body=message.content[:100])
            except Exception:
                pass
    return Response({'success': True, 'data': MessageSerializer(message, context={'request': request}).data}, status=201)

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def edit_message(request, message_id):
    message = get_object_or_404(Message, id=message_id, sender=request.user, is_deleted=False)
    content = request.data.get('content', '').strip()
    if not content:
        return Response({'success': False, 'error': {'message': 'Content required.'}}, status=400)
    message.content = content
    message.is_edited = True
    message.save(update_fields=['content','is_edited','updated_at'])
    return Response({'success': True, 'data': MessageSerializer(message, context={'request': request}).data})

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_message(request, message_id):
    message = get_object_or_404(Message, id=message_id, is_deleted=False)
    if message.sender != request.user:
        return Response({'success': False, 'error': {'message': 'Not authorized.'}}, status=403)
    message.soft_delete()
    return Response({'success': True})

@api_view(['POST','DELETE'])
@permission_classes([permissions.IsAuthenticated])
def toggle_reaction(request, message_id):
    message = get_object_or_404(Message, id=message_id, is_deleted=False)
    emoji = request.data.get('emoji', '').strip()
    if not emoji:
        return Response({'success': False, 'error': {'message': 'Emoji required.'}}, status=400)
    if request.method == 'POST':
        MessageReaction.objects.get_or_create(message=message, user=request.user, emoji=emoji)
        return Response({'success': True})
    else:
        MessageReaction.objects.filter(message=message, user=request.user, emoji=emoji).delete()
        return Response({'success': True})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def thread_messages(request, message_id):
    parent = get_object_or_404(Message, id=message_id)
    replies = Message.objects.filter(parent=parent).select_related('sender').prefetch_related('reactions__user').order_by('created_at')
    return Response({'success': True, 'data': {'parent': MessageSerializer(parent, context={'request': request}).data, 'replies': MessageSerializer(replies, many=True, context={'request': request}).data}})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_messages(request):
    q = request.query_params.get('q', '').strip()
    workspace_slug = request.query_params.get('workspace')
    if len(q) < 2:
        return Response({'success': True, 'data': []})
    qs = Message.objects.filter(content__icontains=q, is_deleted=False)
    if workspace_slug:
        qs = qs.filter(channel__workspace__slug=workspace_slug)
    qs = qs.select_related('sender','channel').order_by('-created_at')[:20]
    return Response({'success': True, 'data': MessageSerializer(qs, many=True, context={'request': request}).data})