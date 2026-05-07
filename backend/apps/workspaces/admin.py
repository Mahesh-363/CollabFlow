from django.contrib import admin
from .models import Workspace, WorkspaceMember

@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ['name','slug','owner','plan','is_active','created_at']
    search_fields = ['name','slug']

@admin.register(WorkspaceMember)
class WorkspaceMemberAdmin(admin.ModelAdmin):
    list_display = ['workspace','user','role','is_active','joined_at']