from django.urls import path
from . import views

app_name = 'files'

urlpatterns = [
    path('upload/<uuid:channel_id>/', views.upload_file, name='upload'),
    path('channel/<uuid:channel_id>/', views.channel_files, name='channel_files'),
]