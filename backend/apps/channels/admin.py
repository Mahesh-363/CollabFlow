from django.contrib import admin
from .models import Channel, ChannelMember

@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    list_display = ['name','workspace','channel_type','is_archived','created_at']

@admin.register(ChannelMember)
class ChannelMemberAdmin(admin.ModelAdmin):
    list_display = ['channel','user','is_active','joined_at']