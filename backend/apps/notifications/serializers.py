from rest_framework import serializers
from .models import Notification
from apps.accounts.serializers import UserPublicSerializer

class NotificationSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    channel_id = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id','sender','notification_type','title','body','is_read','read_at','channel_id','message','workspace','created_at']

    def get_channel_id(self, obj):
        return str(obj.message.channel_id) if obj.message else None