from rest_framework import serializers
from .models import Message, MessageReaction, MessageMention
from apps.accounts.serializers import UserPublicSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    reactions_summary = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id','channel','sender','content','is_edited','is_deleted','is_pinned','parent',
                  'thread_count','reply_count','reactions_summary','attachments','created_at','updated_at']
        read_only_fields = ['id','sender','is_edited','created_at','updated_at']

    def get_reactions_summary(self, obj):
        if obj.is_deleted:
            return []
        request = self.context.get('request')
        current_user = request.user if request else None
        from collections import defaultdict
        grouped = defaultdict(lambda: {'count':0,'users':[],'reacted_by_me':False})
        for reaction in obj.reactions.select_related('user').all():
            g = grouped[reaction.emoji]
            g['count'] += 1
            g['users'].append(reaction.user)
            if current_user and reaction.user_id == current_user.id:
                g['reacted_by_me'] = True
        return [{'emoji':e,'count':d['count'],'users':UserPublicSerializer(d['users'],many=True,context=self.context).data,'reacted_by_me':d['reacted_by_me']} for e,d in grouped.items()]

    def get_reply_count(self, obj):
        return obj.thread_replies.filter(is_deleted=False).count() if obj.parent is None else 0

    def get_attachments(self, obj):
        return []

class CreateMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['content','parent']

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError('Message cannot be empty.')
        if len(value) > 4000:
            raise serializers.ValidationError('Message too long (max 4000 chars).')
        return value