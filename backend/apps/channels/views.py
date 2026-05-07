# backend/apps/channels/views.py
import logging
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.workspaces.models import Workspace
from .models import Channel, ChannelMember
from .serializers import ChannelSerializer, ChannelMemberSerializer
from apps.core.mixins import StandardResponseMixin

logger = logging.getLogger(__name__)


class WorkspaceChannelsView(StandardResponseMixin, generics.GenericAPIView):
    """GET /channels/workspace/<workspace_slug>/  — all channels in a workspace"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChannelSerializer

    def get(self, request, workspace_slug):
        workspace = get_object_or_404(Workspace, slug=workspace_slug)
        channels = Channel.objects.filter(workspace=workspace).order_by('name')
        serializer = self.get_serializer(channels, many=True)
        return self.success(data=serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_channels(request, workspace_slug):
    """GET /channels/workspace/<workspace_slug>/mine/  — channels the user belongs to"""
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
    # Update last_read timestamp for the member
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