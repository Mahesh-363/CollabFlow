# backend/apps/workspaces/views.py
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.mixins import StandardResponseMixin
from .models import Workspace, WorkspaceMember


class WorkspaceListCreateView(StandardResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        member_ids = WorkspaceMember.objects.filter(
            user=request.user
        ).values_list('workspace_id', flat=True)
        workspaces = Workspace.objects.filter(id__in=member_ids)
        data = [_workspace_data(w) for w in workspaces]
        return self.success(data=data)

    def post(self, request):
        name = request.data.get('name', '').strip()
        if not name:
            return self.error(message="Name is required")
        description = request.data.get('description', '')
        icon_color = request.data.get('icon_color', '#4a154b')
        workspace = Workspace.objects.create(
            name=name,
            description=description,
            icon_color=icon_color,
            owner=request.user,
        )
        WorkspaceMember.objects.create(
            user=request.user,
            workspace=workspace,
            role='owner'
        )
        return self.success(data=_workspace_data(workspace), status_code=status.HTTP_201_CREATED)


class WorkspaceDetailView(StandardResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        workspace = get_object_or_404(Workspace, slug=slug)
        return self.success(data=_workspace_data(workspace))

    def patch(self, request, slug):
        workspace = get_object_or_404(Workspace, slug=slug)
        # Only owner/admin can update
        member = WorkspaceMember.objects.filter(
            user=request.user, workspace=workspace
        ).first()
        if not member or member.role not in ('owner', 'admin'):
            return self.error(message="Permission denied", status_code=status.HTTP_403_FORBIDDEN)
        for field in ('name', 'description', 'icon_color'):
            if field in request.data:
                setattr(workspace, field, request.data[field])
        workspace.save()
        return self.success(data=_workspace_data(workspace))


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


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _workspace_data(w):
    return {
        "id": str(w.id),
        "name": w.name,
        "slug": w.slug,
        "description": w.description,
        "icon_color": getattr(w, 'icon_color', '#4a154b'),
        "owner_id": str(w.owner_id),
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