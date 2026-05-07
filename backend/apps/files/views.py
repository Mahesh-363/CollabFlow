from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.channels.models import Channel, ChannelMember
from .models import MessageAttachment

ALLOWED_TYPES = ['image/jpeg','image/png','image/gif','image/webp','application/pdf','text/plain','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/zip','text/csv']
MAX_SIZE = 10 * 1024 * 1024

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_file(request, channel_id):
    channel = get_object_or_404(Channel, id=channel_id)
    get_object_or_404(ChannelMember, channel=channel, user=request.user, is_active=True)
    uploaded = request.FILES.get('file')
    if not uploaded:
        return Response({'success': False, 'error': {'message': 'No file provided.'}}, status=400)
    if uploaded.content_type not in ALLOWED_TYPES:
        return Response({'success': False, 'error': {'message': 'File type not allowed.'}}, status=400)
    if uploaded.size > MAX_SIZE:
        return Response({'success': False, 'error': {'message': 'File exceeds 10MB limit.'}}, status=400)
    attachment = MessageAttachment.objects.create(channel=channel, uploaded_by=request.user, file=uploaded, file_name=uploaded.name, file_type=uploaded.content_type, file_size=uploaded.size)
    return Response({'success': True, 'data': {'id':str(attachment.id),'file_name':attachment.file_name,'file_url':request.build_absolute_uri(attachment.file.url),'file_type':attachment.file_type,'file_size':attachment.file_size,'size_display':attachment.size_display,'is_image':attachment.is_image}}, status=201)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def channel_files(request, channel_id):
    channel = get_object_or_404(Channel, id=channel_id)
    get_object_or_404(ChannelMember, channel=channel, user=request.user, is_active=True)
    files = MessageAttachment.objects.filter(channel=channel).select_related('uploaded_by').order_by('-created_at')[:50]
    data = [{'id':str(f.id),'file_name':f.file_name,'file_url':request.build_absolute_uri(f.file.url),'file_type':f.file_type,'file_size':f.file_size,'size_display':f.size_display,'is_image':f.is_image,'uploaded_by':{'id':str(f.uploaded_by.id),'username':f.uploaded_by.username} if f.uploaded_by else None,'created_at':f.created_at.isoformat()} for f in files]
    return Response({'success': True, 'data': data})