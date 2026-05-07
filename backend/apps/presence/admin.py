from django.contrib import admin
from .models import UserPresence

@admin.register(UserPresence)
class UserPresenceAdmin(admin.ModelAdmin):
    list_display = ['user','status','last_seen']