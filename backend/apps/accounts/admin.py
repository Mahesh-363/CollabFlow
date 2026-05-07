from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email','username','display_name','is_active','is_staff','date_joined']
    list_filter = ['is_active','is_staff','is_verified']
    search_fields = ['email','username','display_name']
    ordering = ['-date_joined']
    fieldsets = (
        (None, {'fields': ('email','username','password')}),
        ('Profile', {'fields': ('display_name','bio','avatar','avatar_color','phone','timezone')}),
        ('Permissions', {'fields': ('is_active','is_staff','is_superuser','is_verified','groups','user_permissions')}),
        ('Dates', {'fields': ('date_joined','last_seen')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('email','username','password1','password2')}),
    )
    readonly_fields = ['date_joined','last_seen']