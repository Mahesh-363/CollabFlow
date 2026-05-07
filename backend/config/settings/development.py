from .base import *

DEBUG = True
ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True

# Use SQLite - no Postgres needed for local dev
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Auto-detect Redis - fallback to in-memory if not available
REDIS_AVAILABLE = False
try:
    import redis as redis_lib
    r = redis_lib.Redis(host='localhost', port=6379, socket_connect_timeout=1)
    r.ping()
    REDIS_AVAILABLE = True
except Exception:
    pass

# if not REDIS_AVAILABLE:
#     CHANNEL_LAYERS = {
#         'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}
#     }
#     CACHES = {
#         'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}
#     }

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',  # no Redis needed for dev
    }
}