import uuid
from django.db import models
from django.conf import settings

def workspace_icon_path(instance, filename):
    ext = filename.rsplit('.', 1)[-1]
    return f'workspaces/{instance.id}/icon.{ext}'

class Workspace(models.Model):
    PLAN_FREE = 'free'
    PLAN_PRO = 'pro'
    PLAN_CHOICES = [(PLAN_FREE,'Free'),(PLAN_PRO,'Pro')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    description = models.TextField(max_length=500, blank=True)
    icon = models.ImageField(upload_to=workspace_icon_path, null=True, blank=True)
    icon_color = models.CharField(max_length=7, default='#6366f1')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default=PLAN_FREE)
    is_active = models.BooleanField(default=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='owned_workspaces')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'workspaces'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.members.filter(is_active=True).count()

class WorkspaceMember(models.Model):
    ROLE_OWNER = 'owner'
    ROLE_ADMIN = 'admin'
    ROLE_MEMBER = 'member'
    ROLE_GUEST = 'guest'
    ROLE_CHOICES = [(ROLE_OWNER,'Owner'),(ROLE_ADMIN,'Admin'),(ROLE_MEMBER,'Member'),(ROLE_GUEST,'Guest')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='workspace_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    is_active = models.BooleanField(default=True)
    nickname = models.CharField(max_length=80, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='invited_members')

    class Meta:
        db_table = 'workspace_members'
        unique_together = [('workspace','user')]

    def __str__(self):
        return f'{self.user.username} in {self.workspace.name} ({self.role})'

    @property
    def is_admin_or_owner(self):
        return self.role in [self.ROLE_OWNER, self.ROLE_ADMIN]

    @property
    def display_name(self):
        return self.nickname or self.user.name