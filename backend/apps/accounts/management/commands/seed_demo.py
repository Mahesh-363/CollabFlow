from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.workspaces.models import Workspace, WorkspaceMember
from apps.channels.models import Channel, ChannelMember
from apps.messages.models import Message

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed demo data for CollabFlow'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding CollabFlow...')

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
                self.stdout.write(f'  Created user: {user.email}')
            else:
                user.set_password(pw)
                user.is_verified = True
                user.save()
            created_users.append(user)

        mahesh, alice, bob, sara, dev = created_users

        workspace, created = Workspace.objects.get_or_create(
            slug='collabflow-demo',
            defaults={
                'name': 'CollabFlow Demo',
                'description': 'Demo workspace for CollabFlow.',
                'owner': mahesh,
                'icon_color': '#6366f1'
            }
        )
        if created:
            self.stdout.write(f'  Created workspace: {workspace.name}')

        for i, user in enumerate(created_users):
            role = WorkspaceMember.ROLE_OWNER if i == 0 else (
                WorkspaceMember.ROLE_ADMIN if i == 1 else WorkspaceMember.ROLE_MEMBER
            )
            WorkspaceMember.objects.get_or_create(
                workspace=workspace, user=user, defaults={'role': role}
            )

        channels_data = [
            {'name': 'general', 'description': 'General discussion', 'is_default': True},
            {'name': 'engineering', 'description': 'Engineering discussions'},
            {'name': 'design', 'description': 'Design discussions'},
            {'name': 'random', 'description': 'Random stuff'},
            {'name': 'announcements', 'description': 'Company announcements'},
        ]

        created_channels = []
        for cd in channels_data:
            channel, created = Channel.objects.get_or_create(
                workspace=workspace, slug=cd['name'],
                defaults={
                    'name': cd['name'],
                    'description': cd['description'],
                    'is_default': cd.get('is_default', False),
                    'channel_type': 'public',
                    'created_by': mahesh
                }
            )
            if created:
                self.stdout.write(f'  Created channel: #{channel.name}')
            created_channels.append(channel)

        general, engineering, design, random_ch, announcements = created_channels

        for channel in created_channels:
            for user in created_users:
                ChannelMember.objects.get_or_create(channel=channel, user=user)

        seed_messages = [
            # general
            (general, mahesh,  "Hey team! CollabFlow is live. Built with Django 5.2, Django Channels, Redis, and Next.js. Real-time all the way."),
            (general, alice,   "This is so clean! WebSocket connection is instant. Love how presence indicators update live."),
            (general, bob,     "Tested it — messages are coming through in under 100ms. Solid work."),
            (general, sara,    "The typing indicators are a nice touch. Really makes it feel like Slack."),
            (general, dev,     "Deployed on Render + Vercel. Zero downtime. Impressed."),
            (general, alice,   "Just created a new channel for design feedback. Check out #design when you get a chance."),
            (general, mahesh,  "Also added JWT refresh token blacklisting on logout — security is tight."),
            (general, bob,     "Nice. What's the plan for file uploads?"),
            (general, mahesh,  "File upload endpoint is already built in the backend. Just need to wire up the UI."),
            (general, sara,    "I can take a look at the UI side this week."),

            # engineering
            (engineering, mahesh, "Architecture: Django 5.2 backend with 7 apps — accounts, workspaces, channels, messages, notifications, presence, files."),
            (engineering, mahesh, "WebSocket consumers: ChatConsumer for messaging, PresenceConsumer for online status, NotificationConsumer for alerts."),
            (engineering, alice,  "The channel layer uses Redis. What is the message retention strategy?"),
            (engineering, mahesh, "Messages persist to PostgreSQL. Redis is only for pub/sub. No message loss on reconnect."),
            (engineering, bob,    "Celery is set up for async tasks. Good call keeping that separate from the request cycle."),
            (engineering, dev,    "JWT setup looks solid. Access token + refresh token with blacklist on logout. How long are access tokens?"),
            (engineering, mahesh, "15 minutes for access tokens, 7 days for refresh. Configurable via env vars."),
            (engineering, alice,  "Frontend uses Zustand for global state and React Query for server state. Clean separation."),
            (engineering, sara,   "The WebSocket reconnect logic with 3s backoff is a nice touch. Handles network drops gracefully."),
            (engineering, bob,    "We should add pagination to the message list. Infinite scroll would be clean."),
            (engineering, mahesh, "On the roadmap. Cursor-based pagination is already on the backend, just need to wire the frontend."),

            # design
            (design, alice,  "Working on the component library. Dark theme variables are in globals.css — easy to customize."),
            (design, sara,   "The sidebar layout feels right. Channel list and workspace switcher is very clean."),
            (design, alice,  "Thinking about avatar upload. Right now initials and color looks clean but custom avatars would be a nice touch."),
            (design, bob,    "Keep the initials fallback for when avatars fail to load. Looks professional."),
            (design, sara,   "The typing animation with the three dots is smooth. Small detail but it matters."),

            # random
            (random_ch, bob,    "Anyone else notice the app feels snappier than Slack? Probably because we are not running Electron."),
            (random_ch, dev,    "Web app all the way. No 500MB download required."),
            (random_ch, sara,   "Hot take: the dark theme is better than Slack."),
            (random_ch, alice,  "Agreed. The indigo accent is much nicer."),
            (random_ch, mahesh, "Ship it."),

            # announcements
            (announcements, mahesh, "CollabFlow v1.0 is live. Real-time messaging, presence tracking, JWT auth, multi-workspace support."),
            (announcements, mahesh, "Demo credentials: mahesh@collabflow.dev / demo1234. Open two tabs to see real-time messaging in action."),
        ]

        created_count = 0
        for channel, sender, content in seed_messages:
            if not Message.objects.filter(channel=channel, sender=sender, content=content).exists():
                Message.objects.create(channel=channel, sender=sender, content=content)
                created_count += 1

        self.stdout.write(f'  Created {created_count} messages')

        if not User.objects.filter(is_superuser=True).exists():
            User.objects.create_superuser(
                email='admin@collabflow.dev',
                username='admin',
                password='admin1234',
                display_name='Admin'
            )
            self.stdout.write('  Created superuser: admin@collabflow.dev')

        self.stdout.write(self.style.SUCCESS('\nSeed complete!'))
        self.stdout.write('Login: mahesh@collabflow.dev / demo1234')
        self.stdout.write('Admin: admin@collabflow.dev / admin1234')