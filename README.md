# V-Ask — Voice-Based Smart Task Manager

A lightweight, offline-first Personal Task Manager PWA that lets you add tasks by voice.

## Project Structure

```
v-ask/
├── frontend/          # Nuxt 3 + TailwindCSS PWA
│   ├── app/
│   ├── components/
│   ├── composables/
│   ├── pages/
│   └── types/
├── backend/           # Node/Express + SQLite API
│   └── src/
├── docker-compose.yml
├── PROJECT_MANIFEST.md
└── AGENT.md
```

## 🐳 Docker (Recommended)

### Quick Start

```bash
# 1. Configure your API key
cp .env.example .env
# Edit .env with your OpenAI API key

# 2. Build and run
docker compose up -d --build

# 3. Access the app
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

### Commands

```bash
# Start
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f

# Rebuild after changes
docker compose up -d --build
```

## 💻 Local Development

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your OpenAI API key
npm install
npm run dev
```

The API runs on `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:3000`

## Features

- **Voice Input**: Add tasks by speaking
- **AI Parsing**: Automatic extraction of dates, times, and titles
- **3 Views**:
  - Today: Focus on today's tasks
  - Calendar: Weekly overview
  - Kanban: Visual task management
- **Offline-first**: Works without internet (except AI parsing)
- **PWA**: Installable on mobile

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TailwindCSS
- **Backend**: Node.js, Express, SQLite
- **AI**: OpenAI / Mistral / OpenRouter

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/parse-note` | Parse text with AI |
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks?date=YYYY-MM-DD` | Get tasks by date |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | - |
| `OPENAI_BASE_URL` | API base URL | `https://api.openai.com/v1` |
| `AI_MODEL` | Model to use | `gpt-4o-mini` |
