# backend/config/asgi.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path, re_path

from apps.messages.consumers import ChatConsumer
from apps.presence.consumers import PresenceConsumer
from apps.notifications.consumers import NotificationConsumer
from config.middleware import JWTAuthMiddleware

django_asgi_app = get_asgi_application()

websocket_urlpatterns = [
    # With channel_id â€” used by chat page
    path('ws/chat/<str:workspace_slug>/<str:channel_id>/', ChatConsumer.as_asgi()),
    # Workspace-only â€” presence/sidebar level connection
    path('ws/presence/',, PresenceConsumer.as_asgi()),
    path('ws/notifications/', NotificationConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
