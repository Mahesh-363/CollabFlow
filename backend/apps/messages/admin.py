from django.contrib import admin
from .models import Message, MessageReaction

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id','channel','sender','is_deleted','is_pinned','created_at']
    list_filter = ['is_deleted','is_pinned','is_edited']
    search_fields = ['content','sender__username']