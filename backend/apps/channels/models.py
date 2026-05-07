import uuid
from django.db import models
from django.conf import settings

class Channel(models.Model):
    TYPE_PUBLIC = 'public'
    TYPE_PRIVATE = 'private'
    TYPE_DM = 'dm'
    TYPE_CHOICES = [(TYPE_PUBLIC,'Public'),(TYPE_PRIVATE,'Private'),(TYPE_DM,'DM')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey('workspaces.Workspace', on_delete=models.CASCADE, related_name='channels')
    name = models.CharField(max_length=80)
    slug = models.SlugField(max_length=80)
    description = models.TextField(max_length=500, blank=True)
    channel_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_PUBLIC)
    topic = models.CharField(max_length=250, blank=True)
    is_archived = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_channels')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'channels'
        unique_together = [('workspace','slug')]
        ordering = ['name']

    def __str__(self):
        return f'#{self.name} ({self.workspace.name})'

    @property
    def member_count(self):
        return self.memberships.filter(is_active=True).count()

class ChannelMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='channel_memberships')
    is_active = models.BooleanField(default=True)
    is_muted = models.BooleanField(default=False)
    last_read_at = models.DateTimeField(null=True, blank=True)
    last_read_message = models.ForeignKey('chat_messages.Message', null=True, blank=True, on_delete=models.SET_NULL, related_name='+')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'channel_members'
        unique_together = [('channel','user')]

    def __str__(self):
        return f'{self.user.username} in #{self.channel.name}'