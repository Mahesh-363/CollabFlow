import uuid
from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPE_MENTION = 'mention'
    TYPE_REPLY = 'reply'
    TYPE_REACTION = 'reaction'
    TYPE_INVITE = 'invite'
    TYPE_SYSTEM = 'system'
    TYPE_CHOICES = [(TYPE_MENTION,'Mention'),(TYPE_REPLY,'Reply'),(TYPE_REACTION,'Reaction'),(TYPE_INVITE,'Invite'),(TYPE_SYSTEM,'System')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications')
    workspace = models.ForeignKey('workspaces.Workspace', on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    message = models.ForeignKey('chat_messages.Message', on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    body = models.TextField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def mark_read(self):
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=['is_read','read_at'])