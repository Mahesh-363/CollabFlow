from django.urls import path
from . import views

app_name = 'presence'

urlpatterns = [
    path('workspace/<slug:workspace_slug>/', views.workspace_presence, name='workspace'),
    path('status/', views.update_status, name='update_status'),
]