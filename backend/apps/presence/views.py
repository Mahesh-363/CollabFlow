from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import UserPresence

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def workspace_presence(request, workspace_slug):
    from apps.workspaces.models import Workspace, WorkspaceMember
    from django.shortcuts import get_object_or_404
    workspace = get_object_or_404(Workspace, slug=workspace_slug)
    member_ids = WorkspaceMember.objects.filter(workspace=workspace, is_active=True).values_list('user_id', flat=True)
    presences = UserPresence.objects.filter(user_id__in=member_ids).select_related('user')
    data = [{'user_id':str(p.user.id),'username':p.user.username,'display_name':p.user.name,'status':p.status,'status_message':p.status_message,'last_seen':p.last_seen.isoformat() if p.last_seen else None} for p in presences]
    return Response({'success': True, 'data': data})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_status(request):
    new_status = request.data.get('status', 'online')
    status_message = request.data.get('status_message', '')
    if new_status not in ['online','away','dnd']:
        return Response({'success': False, 'error': {'message': 'Invalid status.'}}, status=400)
    presence, _ = UserPresence.objects.get_or_create(user=request.user)
    presence.status = new_status
    presence.status_message = status_message
    presence.save(update_fields=['status','status_message','updated_at'])
    return Response({'success': True, 'data': {'status': new_status, 'status_message': status_message}})