from rest_framework import serializers
from django.utils.text import slugify
from .models import Workspace, WorkspaceMember
from apps.accounts.serializers import UserPublicSerializer

class WorkspaceMemberSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = ['id','user','role','nickname','joined_at','is_active']

class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserPublicSerializer(read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    current_user_role = serializers.SerializerMethodField()
    icon_url = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = ['id','name','slug','description','icon','icon_url','icon_color','plan','owner','member_count','current_user_role','created_at']
        read_only_fields = ['id','slug','created_at']
        extra_kwargs = {'icon': {'write_only': True}}

    def get_current_user_role(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        try:
            return obj.members.get(user=request.user, is_active=True).role
        except WorkspaceMember.DoesNotExist:
            return None

    def get_icon_url(self, obj):
        request = self.context.get('request')
        if obj.icon and request:
            return request.build_absolute_uri(obj.icon.url)
        return None

class CreateWorkspaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = ['name','description','icon_color']

    def create(self, validated_data):
        slug = slugify(validated_data['name'])
        base_slug = slug
        counter = 1
        while Workspace.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        validated_data['slug'] = slug
        validated_data['owner'] = self.context['request'].user
        workspace = Workspace.objects.create(**validated_data)
        WorkspaceMember.objects.create(workspace=workspace, user=validated_data['owner'], role=WorkspaceMember.ROLE_OWNER)
        return workspace