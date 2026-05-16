<div align="center">

# ⚡ CollabFlow

### Production-grade real-time collaboration platform — built like Slack, engineered from scratch.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-collabflow--lovat.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://collabflow-lovat.vercel.app)
[![Backend](https://img.shields.io/badge/API-Render-46e3b7?style=for-the-badge&logo=render)](https://collabflow-backend-ghrc.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Mahesh--363%2FCollabFlow-181717?style=for-the-badge&logo=github)](https://github.com/Mahesh-363/CollabFlow)

![CollabFlow Demo](https://img.shields.io/badge/Status-Live%20%F0%9F%9F%A2-success?style=flat-square)
![Django](https://img.shields.io/badge/Django-5.2-092E20?style=flat-square&logo=django)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)
![WebSockets](https://img.shields.io/badge/WebSockets-Django%20Channels-red?style=flat-square)
![Redis](https://img.shields.io/badge/Redis-Channel%20Layer-DC382D?style=flat-square&logo=redis)

</div>

---

## 🚀 Live Demo

> **URL:** https://collabflow-lovat.vercel.app

| Credential | Email | Password |
|---|---|---|
| Demo User | `mahesh@collabflow.dev` | `demo1234` |
| Admin | `admin@collabflow.dev` | `admin1234` |

Open two browser tabs with different accounts to see real-time messaging in action.

---

## ✨ Features

- 🔐 **JWT Authentication** — access + refresh tokens, refresh token blacklisting on logout
- 🏢 **Workspaces** — create/join multiple workspaces with role-based access (Owner / Admin / Member)
- 💬 **Real-time Messaging** — WebSocket-powered chat via Django Channels + Redis channel layer
- 📡 **Presence System** — live online/offline status tracking across connected users
- 🔔 **Notifications** — real-time notification delivery via dedicated WebSocket consumer
- 📁 **Channels** — public/private channels with membership management
- ⚡ **Async Tasks** — Celery + Redis for background job processing
- 🛡️ **Production-ready** — PostgreSQL, Daphne ASGI server, WhiteNoise static files, CORS

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Vercel)                         │
│   Next.js 16 · TypeScript · Tailwind · Zustand · React Query   │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTPS / WSS
┌──────────────────────────▼──────────────────────────────────────┐
│                      BACKEND (Render)                           │
│                    Daphne ASGI Server                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Django 5.2 Application                     │   │
│  │   accounts · workspaces · channels · messages           │   │
│  │   notifications · presence · files                      │   │
│  └──────────────────┬──────────────┬────────────────────── ┘   │
│                     │              │                            │
│          ┌──────────▼───┐  ┌───────▼──────────┐               │
│          │  PostgreSQL  │  │  Redis           │               │
│          │  (Render DB) │  │  Channel Layer   │               │
│          └──────────────┘  │  Celery Broker   │               │
│                            └──────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### WebSocket Consumers

| Consumer | Path | Purpose |
|---|---|---|
| `ChatConsumer` | `ws/chat/<channel_id>/` | Real-time messaging |
| `PresenceConsumer` | `ws/presence/` | Online/offline status |
| `NotificationConsumer` | `ws/notifications/` | Live notifications |

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Django | 5.2 | Web framework |
| Django REST Framework | 3.15 | REST API |
| Django Channels | 4.1 | WebSocket support |
| Daphne | 4.1 | ASGI server |
| Celery | 5.4 | Async task queue |
| Redis | — | Channel layer + Celery broker |
| PostgreSQL | — | Production database |
| SimpleJWT | 5.3 | JWT authentication |
| psycopg2 | 2.9 | PostgreSQL adapter |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16 | React framework (App Router) |
| TypeScript | — | Type safety |
| Tailwind CSS | — | Styling |
| Zustand | — | Global state management |
| React Query | — | Server state + caching |
| Axios | — | HTTP client |

---

## 📁 Project Structure

```
collabflow/
├── backend/
│   ├── apps/
│   │   ├── accounts/        # User auth, JWT, profiles
│   │   ├── workspaces/      # Workspace + member management
│   │   ├── channels/        # Channel CRUD + membership
│   │   ├── messages/        # Message storage + retrieval
│   │   ├── notifications/   # Notification system
│   │   ├── presence/        # Online status tracking
│   │   └── files/           # File attachment handling
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── asgi.py          # ASGI + WebSocket routing
│   │   └── urls.py
│   ├── build.sh             # Render build script
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── login/           # Auth pages
    │   ├── register/
    │   └── app/
    │       └── [workspaceSlug]/
    │           ├── [channelId]/   # Chat interface
    │           ├── members/
    │           ├── notifications/
    │           └── settings/
    ├── components/          # Reusable UI components
    ├── store/               # Zustand stores (auth, app)
    ├── lib/                 # API client, utilities
    └── hooks/               # Custom hooks (WebSocket, etc.)
```

---

## 🚦 Local Development

### Prerequisites
- Python 3.12+
- Node.js 18+
- Redis (running locally)
- PostgreSQL (or use SQLite for dev)

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create .env file
cp .env.example .env  # set your values

python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://localhost:8000" >> .env.local

npm run dev
```

### Environment Variables

**Backend `.env`**
```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend `.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## 🌐 Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://collabflow-lovat.vercel.app |
| Backend API | Render | https://collabflow-backend-ghrc.onrender.com |
| Database | Render PostgreSQL | Internal |
| Redis | Render Redis | Internal |

---

## 👤 Author

**Mahesh V** — Python Backend Developer  
📍 Visakhapatnam, India  
🔗 [GitHub](https://github.com/Mahesh-363) · [Portfolio](https://mahesh-portfolio-beryl.vercel.app/)

---

<div align="center">
  <sub>Built with ⚡ using Python, Django + Next.js</sub>
</div>
