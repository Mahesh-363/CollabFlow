# backend/apps/workspaces/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.WorkspaceListCreateView.as_view(), name='workspace-list'),
    path('<slug:slug>/', views.WorkspaceDetailView.as_view(), name='workspace-detail'),
    path('<slug:slug>/members/', views.WorkspaceMembersView.as_view(), name='workspace-members'),
    path('<slug:slug>/join/', views.join_workspace, name='workspace-join'),
    path('<slug:slug>/leave/', views.leave_workspace, name='workspace-leave'),
]