import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)

class PresenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or isinstance(self.user, AnonymousUser):
            await self.close(code=4001)
            return
        self.group_name = 'presence_global'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self._set_presence('online')
        await self.channel_layer.group_send(self.group_name, {'type':'presence_update','user_id':str(self.user.id),'username':self.user.username,'status':'online'})
        presence_data = await self._get_presence()
        await self.send(text_data=json.dumps({'type':'presence_snapshot','data':presence_data}))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name') and self.user and not isinstance(self.user, AnonymousUser):
            await self._set_presence('offline')
            await self.channel_layer.group_send(self.group_name, {'type':'presence_update','user_id':str(self.user.id),'username':self.user.username,'status':'offline'})
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data.get('type') == 'status_update':
                new_status = data.get('status', 'online')
                if new_status in ['online','away','dnd']:
                    await self._set_presence(new_status, data.get('status_message',''))
                    await self.channel_layer.group_send(self.group_name, {'type':'presence_update','user_id':str(self.user.id),'username':self.user.username,'status':new_status,'status_message':data.get('status_message','')})
        except Exception as e:
            logger.error(f'Presence WS error: {e}')

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({'type':'presence_update','user_id':event['user_id'],'username':event['username'],'status':event['status'],'status_message':event.get('status_message','')}))

    @database_sync_to_async
    def _set_presence(self, status, status_message=''):
        from .models import UserPresence
        from django.utils import timezone
        presence, _ = UserPresence.objects.get_or_create(user=self.user)
        presence.status = status
        presence.status_message = status_message
        presence.last_seen = timezone.now()
        presence.save(update_fields=['status','status_message','last_seen','updated_at'])
        self.user.update_last_seen()

    @database_sync_to_async
    def _get_presence(self):
        from .models import UserPresence
        presences = UserPresence.objects.filter(status__in=['online','away','dnd']).select_related('user')
        return [{'user_id':str(p.user.id),'username':p.user.username,'status':p.status,'status_message':p.status_message} for p in presences]