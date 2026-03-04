# DevPlanner — AI-Powered Productivity Hub for Developers 🚀

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose_8-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-4285F4?logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Socket.io-Real--time-010101?logo=socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white" alt="PWA" />
</p>

A full-stack **MERN** application built for developers and students to manage tasks, plan their day/week, track habits, and boost productivity — powered by **Google Gemini AI** with natural language commands, **real-time notifications**, and **voice input**.

> Built as a Final Year B.Tech CSE Project

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [AI Assistant Commands](#ai-assistant-commands)
- [Cron Jobs](#cron-jobs)
- [PWA Support](#pwa-support)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### 🤖 AI Assistant (Google Gemini)
- **Natural language task management** — create, update, delete, and search tasks by just chatting
- Supports 10 action types: `create_task`, `update_task`, `delete_task`, `list_tasks`, `get_stats`, `create_plan`, `set_reminder`, `search_tasks`, `bulk_update`, `general_chat`
- Floating chat widget accessible from any page
- Model fallback chain: `gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-3-flash-preview`
- Exponential backoff & retry logic for rate limiting
- 🎤 **Voice Input** — speak commands using Web Speech API

### 📋 Task Management
- Full CRUD with categories, priorities, tags, subtasks, notes
- Filter by status (`todo`, `in-progress`, `completed`, `cancelled`), category, priority, due date
- Full-text search across all tasks
- Track estimated vs actual time
- Bulk status updates
- Recurring tasks support
- **Auto-delete completed tasks every 6 hours** (cron job)
- **Manual "Clear Completed"** button

### 📅 Daily Planner
- Set daily goals with completion tracking & progress bar
- **Create tasks directly** from the planner (opens task modal with date pre-filled)
- Mood tracking (5 moods: Great → Terrible)
- Productivity score (0–10 slider)
- Daily reflection / journaling
- Auto-links tasks due on the selected date

### 📊 Weekly Planner
- Weekly goal setting organized by category
- 7-day week-at-a-glance grid with per-day task progress bars
- **Create tasks directly** from the weekly view
- Weekly summary & lessons learned sections
- Overall week rating (0–10)

### 🔁 Habit Tracker
- Create habits with customizable frequency (daily, specific days, weekdays, weekends)
- 7-day completion dot visualization
- Current & best streak tracking
- Total completions & completion rate stats
- Category organization with color coding
- Toggle completion per day

### 📆 Calendar View
- Monthly & weekly calendar with task + habit overlay
- Visual dots indicating tasks/habits on each day
- Click any day to see details
- Navigation between months/weeks

### 📈 Dashboard
- Real-time stats: today / this week / this month progress
- Productivity streak tracking
- Category breakdown with progress bars
- 14-day productivity trend chart (Recharts)
- Upcoming tasks & recently completed sections

### 🔔 Notifications & Email
- In-app notification center with read/unread management
- **Real-time push via Socket.io** — instant updates on task/habit changes
- Email daily digest (8 AM) with **AI-powered summary** (Gemini generates a personalized daily briefing)
- Evening reminder (9 PM) for incomplete tasks
- Weekly progress report (Sunday 9 AM)
- Overdue task alerts
- Configurable notification preferences

### 📱 Progressive Web App (PWA)
- Installable on mobile and desktop
- Service worker with offline caching
- App manifest with theme colors and icons

### ⚙️ Profile & Settings
- Edit display name, bio
- Change password securely
- Notification preferences toggle
- Dark theme throughout

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18.2** | UI framework (functional components + hooks) |
| **Vite 5** | Build tool & dev server |
| **Tailwind CSS 3.4** | Utility-first styling (dark mode) |
| **Zustand 4.4** | Lightweight state management |
| **React Router v6** | Client-side routing |
| **Recharts 2.10** | Dashboard charts & data visualization |
| **Axios** | HTTP client with interceptors |
| **Socket.io Client** | Real-time event handling |
| **React Hot Toast** | Toast notifications |
| **React Icons** | Icon library (HeroIcons) |
| **date-fns** | Date utility functions |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express 4.18** | REST API server |
| **MongoDB + Mongoose 8** | Database & ODM |
| **JWT + bcryptjs** | Authentication & password hashing |
| **Google Generative AI SDK** | Gemini AI integration |
| **Socket.io 4.8** | Real-time WebSocket server |
| **Nodemailer** | Email notifications |
| **node-cron** | Scheduled jobs (digest, cleanup) |
| **express-validator** | Request validation |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (React)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │  Pages   │ │Components│ │  Stores  │ │Context │ │
│  │Dashboard │ │TaskModal │ │taskStore │ │Socket  │ │
│  │Tasks     │ │AIChat    │ │authStore │ │Context │ │
│  │Planner   │ │Layout    │ │          │ │        │ │
│  │Habits    │ │          │ │          │ │        │ │
│  │Calendar  │ │          │ │          │ │        │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
│       │            │            │            │       │
│       └────────────┴─────┬──────┴────────────┘       │
│                          │ Axios + Socket.io          │
└──────────────────────────┼───────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────┼───────────────────────────┐
│                   Server (Express)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │  Routes  │ │Middleware│ │      Services        │ │
│  │ /auth    │ │  JWT     │ │ aiService (Gemini)   │ │
│  │ /tasks   │ │  CORS    │ │ notificationService  │ │
│  │ /planner │ │          │ │ socketService        │ │
│  │ /habits  │ │          │ │                      │ │
│  │ /ai      │ │          │ │  Cron Jobs           │ │
│  │ /stats   │ │          │ │  • Daily digest 8AM  │ │
│  │ /notif.  │ │          │ │  • Evening 9PM       │ │
│  └────┬─────┘ └──────────┘ │  • Weekly Sun 9AM    │ │
│       │                     │  • Cleanup q/6h      │ │
│       │                     └──────────────────────┘ │
│  ┌────▼──────────────────────────────────────┐       │
│  │            MongoDB (Mongoose)             │       │
│  │  Users │ Tasks │ DailyPlans │ WeeklyPlans │       │
│  │  Habits │ Notifications                   │       │
│  └───────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **MongoDB** (local installation or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **npm** or **yarn**
- **Google Gemini API Key** — get one free at [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/devplanner.git
cd devplanner

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

```bash
# Terminal 1 — Start Backend (port 5003)
cd backend
npm run dev

# Terminal 2 — Start Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Docker Setup

This repository now includes:

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf` (reverse proxy for `/api` and `/socket.io`)
- `docker-compose.yml`

### Run with Docker Compose

```bash
# from project root
docker compose up --build -d
```

App URLs:

- Frontend: `http://localhost`
- Backend API health: `http://localhost:5003/api/health`

Stop services:

```bash
docker compose stop
```

If you want to keep MongoDB data volume but stop containers:

```bash
docker compose down
```

If you want to remove MongoDB volume as well:

```bash
docker compose down -v
```

### Deploy to AWS (recommended flow)

1. Build/push `backend` and `frontend` images to **Amazon ECR**.
2. Deploy with **Amazon ECS Fargate** (or EC2 + Docker Compose).
3. Use **Amazon DocumentDB** or **MongoDB Atlas** instead of local Mongo in production.
4. Set production environment variables (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, mail settings) in ECS task definitions or AWS Secrets Manager.

---

## Environment Variables

Create a `backend/.env` file:

```env
# Server
PORT=5003

# Database
MONGODB_URI=mongodb://localhost:27017/devplanner

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Email (Gmail with App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# AI Assistant
GEMINI_API_KEY=your_google_gemini_api_key
```

> **Note:** For Gmail, enable 2-Step Verification and generate an [App Password](https://myaccount.google.com/apppasswords).

---

## Project Structure

```
devplanner/
├── backend/
│   ├── middleware/
│   │   └── auth.js                 # JWT authentication middleware
│   ├── models/
│   │   ├── DailyPlan.js            # Daily planner schema (goals, mood, reflection)
│   │   ├── Habit.js                # Habit schema (streaks, frequency, completions)
│   │   ├── Notification.js         # Notification schema
│   │   ├── Task.js                 # Task schema (subtasks, tags, recurring)
│   │   ├── User.js                 # User schema (profile, preferences)
│   │   └── WeeklyPlan.js           # Weekly planner schema (goals by category)
│   ├── routes/
│   │   ├── ai.js                   # POST /api/ai/chat — Gemini AI endpoint
│   │   ├── auth.js                 # Register, login, profile, password
│   │   ├── habits.js               # Habit CRUD + toggle + stats
│   │   ├── notifications.js        # Notification management
│   │   ├── planner.js              # Daily & weekly planner endpoints
│   │   ├── stats.js                # Dashboard & productivity stats
│   │   └── tasks.js                # Task CRUD + bulk update + cleanup
│   ├── services/
│   │   ├── aiService.js            # Gemini AI integration (model chain, retry)
│   │   ├── notificationService.js  # Email service + AI daily summary
│   │   └── socketService.js        # Socket.io initialization & events
│   ├── server.js                   # Express app entry, cron jobs, Socket.io
│   ├── package.json
│   └── .env                        # Environment variables (not committed)
│
├── frontend/
│   ├── public/
│   │   ├── icons/                  # PWA icons
│   │   ├── manifest.json           # PWA manifest
│   │   └── sw.js                   # Service worker
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js            # Axios instance + all API modules
│   │   ├── components/
│   │   │   ├── AIChat.jsx          # Floating AI chat widget + voice input
│   │   │   ├── Layout.jsx          # Sidebar navigation + layout wrapper
│   │   │   └── TaskModal.jsx       # Create/edit task modal
│   │   ├── contexts/
│   │   │   └── SocketContext.jsx    # Socket.io React context provider
│   │   ├── pages/
│   │   │   ├── CalendarView.jsx    # Monthly/weekly calendar
│   │   │   ├── DailyPlanner.jsx    # Daily goals + tasks + mood + reflection
│   │   │   ├── Dashboard.jsx       # Stats, charts, overview
│   │   │   ├── Habits.jsx          # Habit tracker with streaks
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── Notifications.jsx   # Notification center
│   │   │   ├── Profile.jsx         # Profile & settings
│   │   │   ├── Register.jsx        # Registration page
│   │   │   ├── Tasks.jsx           # Task list with filters
│   │   │   └── WeeklyPlanner.jsx   # Weekly goals + grid + summary
│   │   ├── stores/
│   │   │   ├── authStore.js        # Auth state (Zustand)
│   │   │   └── taskStore.js        # Task state (Zustand)
│   │   ├── App.jsx                 # Root component + routes
│   │   ├── index.css               # Tailwind imports + custom styles
│   │   └── main.jsx                # React DOM entry
│   ├── index.html                  # HTML template (PWA meta tags)
│   ├── tailwind.config.js
│   ├── vite.config.js              # Vite config + API proxy
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login & receive JWT token |
| `GET` | `/api/auth/me` | Get current user profile |
| `PUT` | `/api/auth/profile` | Update profile (name, bio) |
| `PUT` | `/api/auth/password` | Change password |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Get tasks (with filters: status, category, priority, search, sort) |
| `GET` | `/api/tasks/:id` | Get single task |
| `POST` | `/api/tasks` | Create task |
| `PUT` | `/api/tasks/:id` | Update task |
| `PATCH` | `/api/tasks/:id/subtask/:subtaskId` | Toggle subtask completion |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `DELETE` | `/api/tasks/completed/all` | Delete all completed tasks |
| `PATCH` | `/api/tasks/bulk/update` | Bulk update task statuses |

### Planner
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/planner/daily/:date` | Get daily plan (auto-creates if none) |
| `PUT` | `/api/planner/daily/:date` | Update daily plan |
| `GET` | `/api/planner/daily` | Get plans for date range |
| `GET` | `/api/planner/weekly/:weekStart` | Get weekly plan |
| `PUT` | `/api/planner/weekly/:weekStart` | Update weekly plan |
| `GET` | `/api/planner/weekly` | Get recent weekly plans |

### Habits
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/habits` | Get all habits |
| `POST` | `/api/habits` | Create habit |
| `PUT` | `/api/habits/:id` | Update habit |
| `DELETE` | `/api/habits/:id` | Delete habit |
| `POST` | `/api/habits/:id/toggle` | Toggle habit completion for a date |
| `GET` | `/api/habits/overview/stats` | Get habit stats overview |

### AI Assistant
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/chat` | Send natural language command to Gemini AI |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stats/dashboard` | Dashboard overview stats |
| `GET` | `/api/stats/productivity` | Productivity chart data (configurable days) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Get notifications (paginated) |
| `PATCH` | `/api/notifications/:id/read` | Mark single notification as read |
| `PATCH` | `/api/notifications/read-all` | Mark all as read |
| `DELETE` | `/api/notifications/cleanup` | Delete old notifications |

> **Auth:** All endpoints (except register/login) require `Authorization: Bearer <token>` header.

---

## AI Assistant Commands

The AI chat widget understands natural language. Example commands:

| What you say | What happens |
|-------------|-------------|
| *"Create a task to study React hooks, high priority, due tomorrow"* | Creates a task with parsed fields |
| *"Show my pending tasks"* | Lists all tasks with status `todo` |
| *"Mark task Learn MongoDB as completed"* | Updates the task status |
| *"Delete the task about CSS layout"* | Deletes matching task |
| *"What's my productivity this week?"* | Returns stats summary |
| *"Set a reminder for project submission next Friday"* | Creates a reminder task |
| *"Search tasks related to placement prep"* | Searches by keyword |
| *"Update all coding tasks to in-progress"* | Bulk status update |
| *"Plan my week: study DSA, build portfolio, prepare resume"* | Creates multiple tasks |

You can also click the 🎤 microphone button to use **voice input**.

---

## Cron Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| `0 8 * * *` | Daily Digest | AI-generated morning summary email with today's tasks & habits |
| `0 21 * * *` | Evening Reminder | Email reminder for incomplete tasks |
| `0 9 * * 0` | Weekly Report | Weekly progress report email (Sundays) |
| `0 */6 * * *` | Auto Cleanup | Deletes all completed tasks every 6 hours |

---

## Real-time Features (Socket.io)

- **Task events** — automatic UI updates when tasks are created/updated/deleted
- **Habit events** — real-time habit completion sync
- **Notification events** — instant push when new notifications arrive
- **JWT-authenticated connections** — each socket joins a user-specific room

---

## PWA Support

DevPlanner is a **Progressive Web App** — installable on mobile and desktop:

1. Open the app in Chrome/Edge
2. Click the install icon in the address bar (or "Add to Home Screen" on mobile)
3. The app works offline with cached assets via the service worker

---

## Task Categories

| Category | Emoji | Use For |
|----------|-------|---------|
| Coding | 💻 | Programming tasks, bug fixes, features |
| Study | 📚 | Learning, courses, reading |
| Project | 🔨 | Project milestones, deliverables |
| Placement | 🎯 | Interview prep, applications, DSA |
| Personal | 🏠 | Errands, personal goals |
| Health | 💪 | Exercise, wellness, breaks |
| Other | 📌 | Everything else |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ using the MERN Stack + Gemini AI
</p>
