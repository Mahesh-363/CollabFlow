from rest_framework import permissions
from .models import WorkspaceMember, Workspace

class IsWorkspaceMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Workspace):
            return obj.members.filter(user=request.user, is_active=True).exists()
        return True

class IsWorkspaceAdminOrOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        slug = view.kwargs.get('slug')
        if not slug:
            return True
        try:
            workspace = Workspace.objects.get(slug=slug)
            member = workspace.members.get(user=request.user, is_active=True)
            return member.role in [WorkspaceMember.ROLE_OWNER, WorkspaceMember.ROLE_ADMIN]
        except (Workspace.DoesNotExist, WorkspaceMember.DoesNotExist):
            return False