from django.urls import re_path
from apps.messages.consumers import ChatConsumer
from apps.presence.consumers import PresenceConsumer
from apps.notifications.consumers import NotificationConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<channel_id>[0-9a-f-]+)/$', ChatConsumer.as_asgi()),
    re_path(r'ws/presence/$', PresenceConsumer.as_asgi()),
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
]