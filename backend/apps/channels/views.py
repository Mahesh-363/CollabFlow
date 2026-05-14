# backend/apps/channels/views.py
import logging
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.workspaces.models import Workspace, WorkspaceMember
from .models import Channel, ChannelMember
from .serializers import ChannelSerializer, ChannelMemberSerializer
from apps.core.mixins import StandardResponseMixin

logger = logging.getLogger(__name__)


class WorkspaceChannelsView(StandardResponseMixin, generics.GenericAPIView):
    """GET/POST /channels/workspace/<workspace_slug>/"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChannelSerializer

    def get(self, request, workspace_slug):
        workspace = get_object_or_404(Workspace, slug=workspace_slug)
        channels = Channel.objects.filter(workspace=workspace).order_by('name')
        serializer = self.get_serializer(channels, many=True)
        return self.success(data=serializer.data)

    def post(self, request, workspace_slug):
        workspace = get_object_or_404(Workspace, slug=workspace_slug)

        # Check user is a workspace member
        is_member = WorkspaceMember.objects.filter(
            workspace=workspace, user=request.user
        ).exists()
        if not is_member:
            return self.error(message="You are not a member of this workspace", status_code=status.HTTP_403_FORBIDDEN)

        name = request.data.get('name', '').strip()
        if not name:
            return self.error(message="Channel name is required")

        # Generate slug from name
        slug = name.lower().replace(' ', '-')

        # Check slug is unique within workspace
        if Channel.objects.filter(workspace=workspace, slug=slug).exists():
            return self.error(message="A channel with this name already exists")

        channel = Channel.objects.create(
            workspace=workspace,
            name=name,
            slug=slug,
            description=request.data.get('description', ''),
            channel_type=request.data.get('channel_type', 'public'),
            created_by=request.user,
        )

        # Add creator as member
        ChannelMember.objects.create(user=request.user, channel=channel)

        # Also add all workspace members to public channels
        if channel.channel_type == 'public':
            workspace_members = WorkspaceMember.objects.filter(
                workspace=workspace
            ).exclude(user=request.user).select_related('user')
            for wm in workspace_members:
                ChannelMember.objects.get_or_create(user=wm.user, channel=channel)

        serializer = self.get_serializer(channel)
        return self.success(data=serializer.data, status_code=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_channels(request, workspace_slug):
    """GET /channels/workspace/<workspace_slug>/mine/"""
    workspace = get_object_or_404(Workspace, slug=workspace_slug)
    member_channel_ids = ChannelMember.objects.filter(
        user=request.user,
        channel__workspace=workspace
    ).values_list('channel_id', flat=True)

    channels = Channel.objects.filter(id__in=member_channel_ids).order_by('name')
    serializer = ChannelSerializer(channels, many=True)
    return Response({"success": True, "data": serializer.data, "message": ""})


class ChannelDetailView(StandardResponseMixin, generics.GenericAPIView):
    """GET /channels/<id>/"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChannelSerializer

    def get(self, request, id):
        channel = get_object_or_404(Channel, id=id)
        serializer = self.get_serializer(channel)
        return self.success(data=serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_channel(request, channel_id):
    channel = get_object_or_404(Channel, id=channel_id)
    obj, created = ChannelMember.objects.get_or_create(
        user=request.user, channel=channel
    )
    return Response({"success": True, "data": None, "message": "Joined" if created else "Already a member"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_channel(request, channel_id):
    channel = get_object_or_404(Channel, id=channel_id)
    ChannelMember.objects.filter(user=request.user, channel=channel).delete()
    return Response({"success": True, "data": None, "message": "Left channel"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_channel_read(request, channel_id):
    channel = get_object_or_404(Channel, id=channel_id)
    from django.utils import timezone
    ChannelMember.objects.filter(
        user=request.user, channel=channel
    ).update(last_read_at=timezone.now())
    return Response({"success": True, "data": None, "message": "Marked as read"})


class ChannelMembersView(StandardResponseMixin, generics.GenericAPIView):
    """GET /channels/<channel_id>/members/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, channel_id):
        channel = get_object_or_404(Channel, id=channel_id)
        members = ChannelMember.objects.filter(channel=channel).select_related('user')
        serializer = ChannelMemberSerializer(members, many=True)
        return self.success(data=serializer.data)