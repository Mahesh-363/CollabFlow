import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from apps.workspaces.models import Workspace, WorkspaceMember
from apps.channels.models import Channel, ChannelMember
from apps.messages.models import Message

User = get_user_model()
print("Seeding CollabFlow...")

users_data = [
    {'email':'mahesh@collabflow.dev','username':'mahesh','display_name':'Mahesh V','avatar_color':'#6366f1','password':'demo1234'},
    {'email':'alice@collabflow.dev','username':'alice','display_name':'Alice Chen','avatar_color':'#ec4899','password':'demo1234'},
    {'email':'bob@collabflow.dev','username':'bob','display_name':'Bob Smith','avatar_color':'#f59e0b','password':'demo1234'},
    {'email':'sara@collabflow.dev','username':'sara','display_name':'Sara Patel','avatar_color':'#10b981','password':'demo1234'},
    {'email':'dev@collabflow.dev','username':'devuser','display_name':'Dev User','avatar_color':'#3b82f6','password':'demo1234'},
]

created_users = []
for ud in users_data:
    pw = ud.pop('password')
    user, created = User.objects.get_or_create(email=ud['email'], defaults=ud)
    if created:
        user.set_password(pw)
        user.is_verified = True
        user.save()
        print(f"  Created user: {user.email}")
    created_users.append(user)

workspace, created = Workspace.objects.get_or_create(
    slug='collabflow-demo',
    defaults={'name':'CollabFlow Demo','description':'Demo workspace for CollabFlow.','owner':created_users[0],'icon_color':'#6366f1'}
)
if created:
    print(f"  Created workspace: {workspace.name}")

for i, user in enumerate(created_users):
    role = WorkspaceMember.ROLE_OWNER if i == 0 else (WorkspaceMember.ROLE_ADMIN if i == 1 else WorkspaceMember.ROLE_MEMBER)
    WorkspaceMember.objects.get_or_create(workspace=workspace, user=user, defaults={'role':role})

channels_data = [
    {'name':'general','description':'General discussion','is_default':True},
    {'name':'engineering','description':'Engineering discussions'},
    {'name':'design','description':'Design discussions'},
    {'name':'random','description':'Random stuff'},
    {'name':'announcements','description':'Announcements'},
]

created_channels = []
for cd in channels_data:
    channel, created = Channel.objects.get_or_create(
        workspace=workspace, slug=cd['name'],
        defaults={'name':cd['name'],'description':cd['description'],'is_default':cd.get('is_default',False),'channel_type':'public','created_by':created_users[0]}
    )
    if created:
        print(f"  Created channel: #{channel.name}")
    created_channels.append(channel)

for channel in created_channels:
    for user in created_users:
        ChannelMember.objects.get_or_create(channel=channel, user=user)

seed_messages = [
    (created_channels[0], created_users[0], "👋 Welcome to **CollabFlow**! Real-time collaboration platform built with Django + Next.js."),
    (created_channels[0], created_users[1], "This looks amazing! The real-time messaging works perfectly 🚀"),
    (created_channels[0], created_users[2], "Love the clean UI. @alice did you check the engineering channel?"),
    (created_channels[0], created_users[3], "The WebSocket integration is super smooth. Great work @mahesh!"),
    (created_channels[1], created_users[0], "Backend: Django 4.2, DRF, Django Channels, PostgreSQL, Redis, Celery"),
    (created_channels[1], created_users[1], "Frontend: Next.js 14, Tailwind CSS, Zustand, React Query"),
    (created_channels[1], created_users[2], "The WebSocket consumers are well-structured 👌"),
]

for channel, sender, content in seed_messages:
    if not Message.objects.filter(channel=channel, sender=sender, content=content).exists():
        Message.objects.create(channel=channel, sender=sender, content=content)
        print(f"  Message in #{channel.name} by {sender.username}")

if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(email='admin@collabflow.dev', username='admin', password='admin1234', display_name='Admin')
    print("  Created superuser: admin@collabflow.dev / admin1234")

print("\nSeed complete!")
print("Login: mahesh@collabflow.dev / demo1234")
print("Admin: admin@collabflow.dev / admin1234")
print("URL:   http://localhost:8000/api/v1/")