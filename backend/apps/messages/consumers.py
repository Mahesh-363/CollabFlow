import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.channel_id = self.scope['url_route']['kwargs']['channel_id']
        self.room_group_name = f'chat_{self.channel_id}'
        self.user = self.scope.get('user')
        if not self.user or isinstance(self.user, AnonymousUser):
            await self.close(code=4001)
            return
        if not await self._check_channel_access():
            await self.close(code=4003)
            return
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.channel_layer.group_send(self.room_group_name, {'type':'user_joined','user_id':str(self.user.id),'username':self.user.username,'display_name':self.user.name})

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            if self.user and not isinstance(self.user, AnonymousUser):
                await self.channel_layer.group_send(self.room_group_name, {'type':'user_left','user_id':str(self.user.id),'username':self.user.username})
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            msg_type = data.get('type')
            handlers = {
                'message': self._handle_message,
                'typing_start': self._handle_typing_start,
                'typing_stop': self._handle_typing_stop,
                'reaction_add': self._handle_reaction,
                'reaction_remove': self._handle_reaction_remove,
                'message_delete': self._handle_delete,
                'message_edit': self._handle_edit,
            }
            handler = handlers.get(msg_type)
            if handler:
                await handler(data)
        except json.JSONDecodeError:
            await self.send_error('Invalid JSON')
        except Exception as e:
            logger.error(f'WebSocket error: {e}', exc_info=True)

    async def _handle_message(self, data):
        content = data.get('content', '').strip()
        parent_id = data.get('parent_id')
        if not content:
            return
        message = await self._save_message(content, parent_id)
        if message:
            serialized = await self._serialize_message(message)
            await self.channel_layer.group_send(
                self.room_group_name,
                {'type': 'chat_message', 'message': serialized}
            )
            # Send notifications for @mentions
            await self._handle_mentions(content, message)

    async def _handle_mentions(self, content, message):
        import re
        mentions = re.findall(r'@(\w+)', content)
        if not mentions:
            return
        for username in set(mentions):
            await self._create_mention_notification(username, message)

    @database_sync_to_async
    def _create_mention_notification(self, username, message):
        try:
            from django.contrib.auth import get_user_model
            from apps.notifications.models import Notification
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            User = get_user_model()
            recipient = User.objects.filter(username=username).first()
            if not recipient or recipient == self.user:
                return
            notif = Notification.objects.create(
                recipient=recipient,
                sender=self.user,
                message=message,
                workspace=message.channel.workspace,
                notification_type=Notification.TYPE_MENTION,
                title=f'{self.user.display_name or self.user.username} mentioned you',
                body=message.content[:200],
            )
            # Push to notification WebSocket
            channel_layer = get_channel_layer()
            group_name = f'notifications_{recipient.id}'
            unread_count = Notification.objects.filter(recipient=recipient, is_read=False).count()
            async_to_sync(channel_layer.group_send)(group_name, {
                'type': 'notification',
                'data': {
                    'id': str(notif.id),
                    'notification_type': notif.notification_type,
                    'title': notif.title,
                    'body': notif.body,
                    'is_read': False,
                    'created_at': notif.created_at.isoformat(),
                    'unread_count': unread_count,
                }
            })
        except Exception as e:
            logger.error(f'Error creating mention notification: {e}')

    async def _handle_typing_start(self, data):
        await self.channel_layer.group_send(self.room_group_name, {'type':'typing_indicator','user_id':str(self.user.id),'username':self.user.username,'display_name':self.user.name,'is_typing':True})

    async def _handle_typing_stop(self, data):
        await self.channel_layer.group_send(self.room_group_name, {'type':'typing_indicator','user_id':str(self.user.id),'username':self.user.username,'display_name':self.user.name,'is_typing':False})

    async def _handle_reaction(self, data):
        message_id = data.get('message_id')
        emoji = data.get('emoji', '').strip()
        if message_id and emoji:
            await self._save_reaction(message_id, emoji)
            await self.channel_layer.group_send(self.room_group_name, {'type':'reaction_update','message_id':message_id,'emoji':emoji,'user_id':str(self.user.id),'action':'add'})

    async def _handle_reaction_remove(self, data):
        message_id = data.get('message_id')
        emoji = data.get('emoji', '').strip()
        if message_id and emoji:
            await self._remove_reaction(message_id, emoji)
            await self.channel_layer.group_send(self.room_group_name, {'type':'reaction_update','message_id':message_id,'emoji':emoji,'user_id':str(self.user.id),'action':'remove'})

    async def _handle_delete(self, data):
        message_id = data.get('message_id')
        if message_id and await self._delete_message(message_id):
            await self.channel_layer.group_send(self.room_group_name, {'type':'message_deleted','message_id':message_id,'channel_id':self.channel_id})

    async def _handle_edit(self, data):
        message_id = data.get('message_id')
        content = data.get('content', '').strip()
        if message_id and content:
            message = await self._edit_message(message_id, content)
            if message:
                await self.channel_layer.group_send(self.room_group_name, {'type':'message_edited','message':await self._serialize_message(message)})

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({'type':'message','message':event['message']}, default=str))

    async def typing_indicator(self, event):
        if str(self.user.id) != event['user_id']:
            await self.send(text_data=json.dumps({'type':'typing','user_id':event['user_id'],'username':event['username'],'display_name':event['display_name'],'is_typing':event['is_typing']}))

    async def reaction_update(self, event):
        await self.send(text_data=json.dumps({'type':'reaction','message_id':event['message_id'],'emoji':event['emoji'],'user_id':event['user_id'],'action':event['action']}))

    async def message_deleted(self, event):
        await self.send(text_data=json.dumps({'type':'message_deleted','message_id':event['message_id']}))

    async def message_edited(self, event):
        await self.send(text_data=json.dumps({'type':'message_edited','message':event['message']}))

    async def user_joined(self, event):
        if str(self.user.id) != event['user_id']:
            await self.send(text_data=json.dumps({'type':'user_joined','user_id':event['user_id'],'username':event['username']}))

    async def user_left(self, event):
        if str(self.user.id) != event['user_id']:
            await self.send(text_data=json.dumps({'type':'user_left','user_id':event['user_id'],'username':event['username']}))

    @database_sync_to_async
    def _check_channel_access(self):
        from apps.channels.models import ChannelMember
        return ChannelMember.objects.filter(channel_id=self.channel_id, user=self.user, is_active=True).exists()

    @database_sync_to_async
    def _save_message(self, content, parent_id=None):
        from .models import Message
        from apps.channels.models import Channel
        try:
            channel = Channel.objects.get(id=self.channel_id)
            parent = None
            if parent_id:
                try:
                    parent = Message.objects.get(id=parent_id, channel=channel)
                except Message.DoesNotExist:
                    pass
            msg = Message.objects.create(channel=channel, sender=self.user, content=content, parent=parent)
            if parent:
                parent.thread_count = parent.thread_replies.count()
                parent.save(update_fields=['thread_count'])
            return msg
        except Exception as e:
            logger.error(f'Error saving message: {e}')
            return None

    @database_sync_to_async
    def _serialize_message(self, message):
        from .serializers import MessageSerializer
        return MessageSerializer(message).data

    @database_sync_to_async
    def _save_reaction(self, message_id, emoji):
        from .models import Message, MessageReaction
        try:
            message = Message.objects.get(id=message_id)
            MessageReaction.objects.get_or_create(message=message, user=self.user, emoji=emoji)
        except Exception:
            pass

    @database_sync_to_async
    def _remove_reaction(self, message_id, emoji):
        from .models import MessageReaction
        MessageReaction.objects.filter(message_id=message_id, user=self.user, emoji=emoji).delete()

    @database_sync_to_async
    def _delete_message(self, message_id):
        from .models import Message
        try:
            message = Message.objects.get(id=message_id, is_deleted=False)
            if message.sender == self.user:
                message.soft_delete()
                return True
        except Message.DoesNotExist:
            pass
        return False

    @database_sync_to_async
    def _edit_message(self, message_id, content):
        from .models import Message
        try:
            message = Message.objects.get(id=message_id, sender=self.user, is_deleted=False)
            message.content = content
            message.is_edited = True
            message.save(update_fields=['content','is_edited','updated_at'])
            return message
        except Message.DoesNotExist:
            return None

    async def send_error(self, message):
        await self.send(text_data=json.dumps({'type':'error','message':message}))