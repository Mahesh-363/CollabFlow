# CollabFlow ⚡

> A production-grade real-time collaboration platform built with Django + Next.js

![CollabFlow](https://img.shields.io/badge/CollabFlow-v1.0-6366f1?style=for-the-badge)
![Django](https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs)
![WebSockets](https://img.shields.io/badge/WebSockets-Real--time-10b981?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

---

## What is CollabFlow?

CollabFlow is a full-stack, production-ready team collaboration platform inspired by **Slack** and **Microsoft Teams**. Built as a flagship portfolio project to demonstrate end-to-end engineering across backend, frontend, real-time infrastructure, and DevOps.

**Live Features:**
- 💬 Real-time messaging with WebSockets
- 👥 Workspaces and channels (public & private)
- ⌨️ Typing indicators
- 👁️ User presence (online / away / DND / offline)
- 🔔 Real-time push notifications
- 😊 Emoji reactions on messages
- 🧵 Threaded replies
- 📎 File uploads (images, PDFs, docs)
- 🔍 Full-text message search
- 🔐 JWT authentication with auto-refresh
- 🛡️ Role-based access (Owner / Admin / Member / Guest)
- 📱 Responsive dark-themed UI

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Django 4.2 | Web framework |
| Django REST Framework | REST API |
| Django Channels | WebSocket support |
| Daphne | ASGI server |
| PostgreSQL | Primary database |
| SQLite | Local development |
| Redis | Channel layer + caching |
| Celery | Async task queue |
| JWT (SimpleJWT) | Authentication |

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 | React framework |
| Tailwind CSS | Styling |
| Zustand | Global state management |
| React Query | Server state & caching |
| Axios | HTTP client with auto-refresh |
| date-fns | Date formatting |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Multi-service orchestration |
| Nginx | Reverse proxy + WebSocket routing |
| AWS | Deployment target (EC2 / ECS) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Nginx                            │
│           (Reverse Proxy + WebSocket Routing)           │
└────────────┬──────────────────────────┬─────────────────┘
             │                          │
    ┌────────▼────────┐       ┌─────────▼────────┐
    │   Next.js 16    │       │   Django + Daphne │
    │   (Frontend)    │       │   (Backend ASGI)  │
    └─────────────────┘       └────────┬──────────┘
                                       │
                          ┌────────────┼────────────┐
                          │            │            │
                   ┌──────▼──┐  ┌─────▼──┐  ┌─────▼──┐
                   │PostgreSQL│  │ Redis  │  │Celery  │
                   └─────────┘  └────────┘  └────────┘
```

### WebSocket Consumers
- `/ws/chat/{channel_id}/` — Real-time messaging, typing, reactions
- `/ws/presence/` — Online/offline status broadcast
- `/ws/notifications/` — Per-user notification push

---

## Project Structure

```
collabflow/
├── backend/
│   ├── apps/
│   │   ├── accounts/        # Custom User model, JWT auth
│   │   ├── workspaces/      # Workspace + member management
│   │   ├── channels/        # Channel CRUD + membership
│   │   ├── messages/        # Messages, reactions, threads, WS consumer
│   │   ├── notifications/   # Notification model + WS consumer
│   │   ├── files/           # File upload handling
│   │   └── presence/        # User presence + WS consumer
│   ├── config/
│   │   ├── settings/        # base / development / production
│   │   ├── asgi.py          # ASGI + WebSocket routing
│   │   ├── urls.py          # API routes
│   │   └── routing.py       # WebSocket routes
│   ├── manage.py
│   ├── seed.py              # Demo data seeder
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── login/           # Login page
│   │   ├── register/        # Register page
│   │   └── app/
│   │       ├── page.tsx             # Workspace selector
│   │       └── [workspaceSlug]/
│   │           ├── page.tsx         # Workspace home
│   │           ├── [channelId]/     # Real-time chat
│   │           ├── notifications/
│   │           ├── members/
│   │           ├── search/
│   │           └── settings/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── MessageItem.tsx
│   │   └── MessageInput.tsx
│   ├── hooks/
│   │   └── useWebSocket.ts  # Chat + Presence + Notification hooks
│   ├── lib/
│   │   └── api.ts           # Axios client + JWT interceptors
│   └── store/
│       ├── authStore.ts     # Auth state (Zustand)
│       └── appStore.ts      # App state (messages, presence, typing)
│
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Local Development (No Docker)

**1. Clone the repo**
```bash
git clone https://github.com/yourusername/collabflow.git
cd collabflow
```

**2. Backend setup**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python seed.py
python manage.py runserver 8000
```

**3. Frontend setup** (new terminal)
```bash
cd frontend
npm install
npm run dev
```

**4. Open browser**
```
http://localhost:3000
```

### Docker (Full Stack)

```bash
docker-compose up --build
docker exec collabflow_backend python seed.py
```

Open: `http://localhost`

---

## Demo Credentials

| Email | Password | Role |
|---|---|---|
| mahesh@collabflow.dev | demo1234 | Owner |
| alice@collabflow.dev | demo1234 | Admin |
| bob@collabflow.dev | demo1234 | Member |
| admin@collabflow.dev | admin1234 | Django Admin |

Django Admin: `http://localhost:8000/admin/`

---

## API Overview

```
POST   /api/v1/auth/register/
POST   /api/v1/auth/login/
POST   /api/v1/auth/logout/
GET    /api/v1/auth/profile/

GET    /api/v1/workspaces/
POST   /api/v1/workspaces/
GET    /api/v1/workspaces/{slug}/
GET    /api/v1/workspaces/{slug}/members/

GET    /api/v1/channels/workspace/{slug}/
POST   /api/v1/channels/workspace/{slug}/
GET    /api/v1/channels/workspace/{slug}/mine/
POST   /api/v1/channels/{id}/join/

GET    /api/v1/messages/channel/{id}/
POST   /api/v1/messages/channel/{id}/send/
PUT    /api/v1/messages/{id}/edit/
DELETE /api/v1/messages/{id}/delete/
POST   /api/v1/messages/{id}/reactions/
GET    /api/v1/messages/{id}/thread/
GET    /api/v1/messages/search/

GET    /api/v1/notifications/
POST   /api/v1/notifications/mark-all-read/
```

---

## Environment Variables

**Backend** (`.env`)
```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
USE_SQLITE=True
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend** (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## Deployment (AWS)

```bash
# 1. Set production values in .env.docker
# 2. Build and deploy
docker-compose -f docker-compose.yml up -d --build

# 3. Seed data
docker exec collabflow_backend python seed.py
```

Supports deployment on:
- AWS EC2 (Docker Compose)
- AWS ECS (container service)
- Any VPS with Docker installed

---

## Key Engineering Highlights

- **Async WebSocket consumers** — Separate consumers for chat, presence, and notifications using Django Channels + Redis channel layer
- **JWT auto-refresh** — Axios interceptor silently refreshes expired tokens without logging the user out
- **Cursor-based pagination** — Messages load efficiently using DRF cursor pagination
- **Soft deletes** — Messages are soft-deleted, preserving thread integrity
- **Role-based permissions** — Owner → Admin → Member → Guest hierarchy enforced at API level
- **Hydration-safe auth** — Zustand persist with hydration guards prevents 401 errors on page load
- **Production-ready Docker setup** — Multi-service compose with health checks, Nginx WebSocket routing, and volume persistence

---

## License

MIT — free to use for portfolio, learning, or production.

---

Built with ❤️ by [Mahesh V](https://github.com/yourusername)
