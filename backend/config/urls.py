from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include([
        path('auth/', include('apps.accounts.urls')),
        path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('workspaces/', include('apps.workspaces.urls')),
        path('channels/', include('apps.channels.urls')),
        path('messages/', include('apps.messages.urls')),
        path('notifications/', include('apps.notifications.urls')),
        path('files/', include('apps.files.urls')),
        path('presence/', include('apps.presence.urls')),
    ])),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)