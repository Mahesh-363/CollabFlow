from rest_framework import serializers
from django.utils.text import slugify
from .models import Channel, ChannelMember
from apps.accounts.serializers import UserPublicSerializer

class ChannelSerializer(serializers.ModelSerializer):
    created_by = UserPublicSerializer(read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    is_member = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Channel
        fields = ['id','name','slug','description','channel_type','topic','is_archived','is_default','created_by','member_count','is_member','unread_count','created_at']
        read_only_fields = ['id','slug','created_at']

    def get_is_member(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        return obj.memberships.filter(user=request.user, is_active=True).exists()

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        try:
            membership = obj.memberships.get(user=request.user, is_active=True)
            if membership.last_read_at:
                return obj.messages.filter(created_at__gt=membership.last_read_at, is_deleted=False).exclude(sender=request.user).count()
            return obj.messages.filter(is_deleted=False).exclude(sender=request.user).count()
        except ChannelMember.DoesNotExist:
            return 0

class CreateChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Channel
        fields = ['name','description','channel_type','topic']

    def validate_name(self, value):
        return value.lower().replace(' ', '-')

    def create(self, validated_data):
        workspace = self.context['workspace']
        user = self.context['request'].user
        slug = slugify(validated_data['name'])
        base_slug = slug
        counter = 1
        while Channel.objects.filter(workspace=workspace, slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        channel = Channel.objects.create(workspace=workspace, slug=slug, created_by=user, **validated_data)
        ChannelMember.objects.create(channel=channel, user=user)
        return channel

class ChannelMemberSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = ChannelMember
        fields = ['id','user','is_muted','last_read_at','joined_at']