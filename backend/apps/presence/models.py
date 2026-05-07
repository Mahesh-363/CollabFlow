import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class UserPresence(models.Model):
    STATUS_ONLINE = 'online'
    STATUS_AWAY = 'away'
    STATUS_DND = 'dnd'
    STATUS_OFFLINE = 'offline'
    STATUS_CHOICES = [(STATUS_ONLINE,'Online'),(STATUS_AWAY,'Away'),(STATUS_DND,'Do Not Disturb'),(STATUS_OFFLINE,'Offline')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='presence')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OFFLINE)
    status_message = models.CharField(max_length=100, blank=True)
    last_seen = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_presence'

    def set_online(self):
        self.status = self.STATUS_ONLINE
        self.last_seen = timezone.now()
        self.save(update_fields=['status','last_seen','updated_at'])

    def set_offline(self):
        self.status = self.STATUS_OFFLINE
        self.last_seen = timezone.now()
        self.save(update_fields=['status','last_seen','updated_at'])