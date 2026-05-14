# backend/apps/workspaces/views.py
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import uuid

from apps.core.mixins import StandardResponseMixin
from .models import Workspace, WorkspaceMember


class WorkspaceListCreateView(StandardResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        member_ids = WorkspaceMember.objects.filter(
            user=request.user
        ).values_list('workspace_id', flat=True)
        workspaces = Workspace.objects.filter(id__in=member_ids)
        data = [_workspace_data(w, request.user) for w in workspaces]
        return self.success(data=data)

    def post(self, request):
        from apps.channels.models import Channel, ChannelMember
        name = request.data.get('name', '').strip()
        if not name:
            return self.error(message="Name is required")
        description = request.data.get('description', '')
        icon_color = request.data.get('icon_color', '#4a154b')

        # Generate unique slug from name
        base_slug = slugify(name) or 'workspace'
        slug = base_slug
        counter = 1
        while Workspace.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{counter}'
            counter += 1

        workspace = Workspace.objects.create(
            name=name,
            slug=slug,
            description=description,
            icon_color=icon_color,
            owner=request.user,
        )
        WorkspaceMember.objects.create(
            user=request.user,
            workspace=workspace,
            role='owner'
        )
        # Auto-create #general channel
        general = Channel.objects.create(
            workspace=workspace,
            name='general',
            slug='general',
            description='General discussion',
            channel_type='public',
            is_default=True,
            created_by=request.user,
        )
        ChannelMember.objects.create(user=request.user, channel=general)
        return self.success(data=_workspace_data(workspace, request.user), status_code=status.HTTP_201_CREATED)


class WorkspaceDetailView(StandardResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        workspace = get_object_or_404(Workspace, slug=slug)
        return self.success(data=_workspace_data(workspace, request.user))

    def patch(self, request, slug):
        workspace = get_object_or_404(Workspace, slug=slug)
        member = WorkspaceMember.objects.filter(
            user=request.user, workspace=workspace
        ).first()
        if not member or member.role not in ('owner', 'admin'):
            return self.error(message="Permission denied", status_code=status.HTTP_403_FORBIDDEN)
        for field in ('name', 'description', 'icon_color'):
            if field in request.data:
                setattr(workspace, field, request.data[field])
        workspace.save()
        return self.success(data=_workspace_data(workspace, request.user))


class WorkspaceMembersView(StandardResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        workspace = get_object_or_404(Workspace, slug=slug)
        members = WorkspaceMember.objects.filter(
            workspace=workspace
        ).select_related('user')
        data = [_member_data(m) for m in members]
        return self.success(data=data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_workspace(request, slug):
    workspace = get_object_or_404(Workspace, slug=slug)
    _, created = WorkspaceMember.objects.get_or_create(
        user=request.user,
        workspace=workspace,
        defaults={'role': 'member'}
    )
    msg = "Joined workspace" if created else "Already a member"
    return Response({"success": True, "data": None, "message": msg})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_workspace(request, slug):
    workspace = get_object_or_404(Workspace, slug=slug)
    WorkspaceMember.objects.filter(
        user=request.user, workspace=workspace
    ).exclude(role='owner').delete()
    return Response({"success": True, "data": None, "message": "Left workspace"})


# --- Helpers ------------------------------------------------------------------

def _workspace_data(w, user=None):
    member_count = WorkspaceMember.objects.filter(workspace=w).count()
    role = None
    if user:
        m = WorkspaceMember.objects.filter(workspace=w, user=user).first()
        role = m.role if m else None
    return {
        "id": str(w.id),
        "name": w.name,
        "slug": w.slug,
        "description": w.description,
        "icon_color": getattr(w, 'icon_color', '#4a154b'),
        "owner_id": str(w.owner_id),
        "member_count": member_count,
        "current_user_role": role,
        "created_at": w.created_at.isoformat() if hasattr(w, 'created_at') else None,
    }


def _member_data(m):
    u = m.user
    return {
        "id": str(u.id),
        "username": u.username,
        "display_name": getattr(u, 'display_name', u.username) or u.username,
        "email": u.email,
        "role": m.role,
        "avatar_url": getattr(u, 'avatar_url', None),
    }