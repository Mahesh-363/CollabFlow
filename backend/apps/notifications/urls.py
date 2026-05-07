from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='list'),
    path('unread-count/', views.unread_count, name='unread_count'),
    path('mark-all-read/', views.mark_all_read, name='mark_all_read'),
    path('<uuid:notification_id>/read/', views.mark_read, name='mark_read'),
]