"""
Basic tests for CollabFlow backend.
Run with: python manage.py test tests
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AuthTests(TestCase):
    """Test JWT authentication endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@collabflow.dev',
            username='testuser',
            password='testpass123',
            display_name='Test User',
            is_verified=True,
        )

    def test_login_valid_credentials(self):
        response = self.client.post('/api/v1/auth/login/', {
            'email': 'test@collabflow.dev',
            'password': 'testpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data['data'])
        self.assertIn('refresh', response.data['data'])

    def test_login_invalid_credentials(self):
        response = self.client.post('/api/v1/auth/login/', {
            'email': 'test@collabflow.dev',
            'password': 'wrongpassword',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_register_new_user(self):
        response = self.client.post('/api/v1/auth/register/', {
            'email': 'new@collabflow.dev',
            'username': 'newuser',
            'password': 'newpass123',
            'display_name': 'New User',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='new@collabflow.dev').exists())

    def test_register_duplicate_email(self):
        response = self.client.post('/api/v1/auth/register/', {
            'email': 'test@collabflow.dev',
            'username': 'anotheruser',
            'password': 'newpass123',
            'display_name': 'Another User',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_protected_endpoint_requires_auth(self):
        response = self.client.get('/api/v1/workspaces/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_with_auth(self):
        login = self.client.post('/api/v1/auth/login/', {
            'email': 'test@collabflow.dev',
            'password': 'testpass123',
        })
        token = login.data['data']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/v1/workspaces/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class WorkspaceTests(TestCase):
    """Test workspace creation and membership."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='owner@collabflow.dev',
            username='owner',
            password='testpass123',
            display_name='Owner',
            is_verified=True,
        )
        login = self.client.post('/api/v1/auth/login/', {
            'email': 'owner@collabflow.dev',
            'password': 'testpass123',
        })
        self.token = login.data['data']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_create_workspace(self):
        response = self.client.post('/api/v1/workspaces/', {
            'name': 'Test Workspace',
            'description': 'A test workspace',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['name'], 'Test Workspace')

    def test_list_workspaces(self):
        self.client.post('/api/v1/workspaces/', {'name': 'WS 1'})
        self.client.post('/api/v1/workspaces/', {'name': 'WS 2'})
        response = self.client.get('/api/v1/workspaces/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['data']), 2)

    def test_workspace_slug_generated(self):
        response = self.client.post('/api/v1/workspaces/', {
            'name': 'My Cool Workspace',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('slug', response.data['data'])
        self.assertTrue(len(response.data['data']['slug']) > 0)