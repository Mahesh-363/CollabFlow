from django.urls import path
from . import views

app_name = 'channels'

urlpatterns = [
    path('workspace/<slug:workspace_slug>/', views.WorkspaceChannelsView.as_view(), name='list_create'),
    path('workspace/<slug:workspace_slug>/mine/', views.my_channels, name='my_channels'),
    path('<uuid:id>/', views.ChannelDetailView.as_view(), name='detail'),
    path('<uuid:channel_id>/join/', views.join_channel, name='join'),
    path('<uuid:channel_id>/leave/', views.leave_channel, name='leave'),
    path('<uuid:channel_id>/read/', views.mark_channel_read, name='mark_read'),
    path('<uuid:channel_id>/members/', views.ChannelMembersView.as_view(), name='members'),
]