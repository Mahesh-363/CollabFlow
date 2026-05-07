from django.contrib import admin
from .models import MessageAttachment

@admin.register(MessageAttachment)
class MessageAttachmentAdmin(admin.ModelAdmin):
    list_display = ['file_name','file_type','file_size','uploaded_by','created_at']