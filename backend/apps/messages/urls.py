from django.urls import path
from . import views

app_name = 'messages'

urlpatterns = [
    path('channel/<uuid:channel_id>/', views.ChannelMessagesView.as_view(), name='list'),
    path('channel/<uuid:channel_id>/send/', views.send_message, name='send'),
    path('<uuid:message_id>/edit/', views.edit_message, name='edit'),
    path('<uuid:message_id>/delete/', views.delete_message, name='delete'),
    path('<uuid:message_id>/reactions/', views.toggle_reaction, name='reactions'),
    path('<uuid:message_id>/thread/', views.thread_messages, name='thread'),
    path('search/', views.search_messages, name='search'),
]