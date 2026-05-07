import uuid
from django.db import models
from django.conf import settings

def message_file_upload_path(instance, filename):
    ext = filename.rsplit('.', 1)[-1] if '.' in filename else 'bin'
    return f'uploads/{instance.uploaded_by.id}/{uuid.uuid4()}.{ext}'

class MessageAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey('chat_messages.Message', on_delete=models.CASCADE, related_name='attachments', null=True, blank=True)
    channel = models.ForeignKey('chat_channels.Channel', on_delete=models.CASCADE, related_name='files')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='uploaded_files')
    file = models.FileField(upload_to=message_file_upload_path)
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_size = models.PositiveBigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'message_attachments'
        ordering = ['-created_at']

    @property
    def is_image(self):
        return self.file_type.startswith('image/')

    @property
    def size_display(self):
        size = self.file_size
        for unit in ['B','KB','MB','GB']:
            if size < 1024:
                return f'{size:.1f} {unit}'
            size /= 1024
        return f'{size:.1f} TB'