# Project Manifest — Voice-Based Smart Task Manager (PWA)

## 1. Project Overview
This project is a lightweight, offline-first Personal Task Manager designed as a mobile-friendly PWA.  
Its purpose is to allow the user to add tasks *by voice*, automatically extract scheduling information using an external AI API, and display tasks in a clean and minimal interface based on three main views:

- **Today**
- **Calendar**
- **Kanban**

The system stores data locally (SQLite or IndexedDB depending on architecture), and interfaces with a small backend for AI parsing and CRUD operations.

The end goal:  
A frictionless system where the user *speaks*, the app *understands*, and the user immediately sees what to do today, this week, or later.

---

## 2. Core Functionalities

### 2.1 Voice-to-Task Flow
- User taps microphone button.
- The browser's native speech-to-text is used (not custom STT).
- Captured text is sent to `/api/parse-note`.
- The external AI (OpenAI / Mistral / OpenRouter) extracts:
  - `title` (short, clear)
  - `note` (original text)
  - `date` (YYYY-MM-DD)
  - `time` (HH:MM or null)
- The backend returns a strict JSON object:
```json
{
  "title": "string",
  "note": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM"
}
```
- The frontend calls `/api/tasks` to create the task.

### 2.2 Task Model
A task contains:
```ts
Task {
  id: string
  title: string
  note: string
  date: string | null
  time: string | null
  status: "todo" | "doing" | "done"
  created_at: number
}
```

### 2.3 Views

#### 2.3.1 Today View
- Automatically loaded at app startup.
- Displays tasks where `date == today` and `status != done`.
- Actions:
  - Mark as done
  - Edit (optional in V1)
  - Delete

- Voice input area with:
  - Textarea
  - Mic button
  - "Create tasks" button

#### 2.3.2 Calendar View
- Weekly selector (horizontal day picker).
- Displays all tasks scheduled for the selected day.
- Minimal daily summary indicators (e.g., dots under each day).
- Actions:
  - Change date of a task
  - Mark done

#### 2.3.3 Kanban View
Four columns:
1. **Inbox** – tasks without scheduled date
2. **This week** – tasks scheduled between today and today+6
3. **In progress** – `status == "doing"`
4. **Done** – completed tasks

Actions:
- Move tasks between columns (update status/date)
- Drag & drop (future version; not mandatory in MVP)

---

## 3. Backend Requirements

### 3.1 Endpoints

#### POST /api/parse-note
Input:
```json
{ "text": "string" }
```
Output:
```json
{
  "title": "string",
  "note": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM"
}
```

#### POST /api/tasks
Creates a task with the parsed data.

#### GET /api/tasks?date=YYYY-MM-DD
Returns all tasks on that date.

#### GET /api/tasks
Returns all tasks.

#### PUT /api/tasks/:id
Updates:
- date
- time
- status
- note
- title

#### DELETE /api/tasks/:id
Removes a task.

---

## 4. External AI Provider Requirements

### 4.1 AI responsibilities
The AI must:
1. Detect date (absolute or relative)  
2. Detect time  
3. Generate a short 3–6 word title  
4. Return a JSON strictly formatted  
5. Never add explanations, comments, or text outside the JSON

### 4.2 Example prompt

```
You are an assistant that transforms natural language notes into structured tasks.

Your output MUST be a strict JSON object:
{
  "title": "...",
  "note": "...",
  "date": "YYYY-MM-DD",
  "time": "HH:MM"
}

Rules:
- Parse the scheduling information (date/time).
- Convert relative dates like "next Tuesday" to absolute YYYY-MM-DD.
- Default time if missing: "09:00".
- Title must be 3-6 words maximum.
- Return ONLY the JSON object. No explanation, no extra text.
```

---

## 5. UI / UX Principles
- Soft, clean, minimalistic.
- Touch-friendly (mobile-first).
- Bottom navigation with 3 tabs: Today / Calendar / Kanban.
- Light color palette with subtle shadows and rounded cards.
- Task cards:
  - Title in bold
  - Subtitle with note preview
  - Small badge for project (optional)
- Consistency across all screens.

---

## 6. Non-Goals (explicit)
The following features are **NOT part of MVP**:
- User accounts or authentication
- Sync across multiple devices
- Collaboration / sharing tasks
- Reminders per task (only daily summary reminders)
- Recurring tasks
- Multi-project management (optional later)
- Offline AI (no LLM embedded)

---

## 7. Future Enhancements (V1+)
- Drag & drop in Kanban
- Per-task reminders
- Smart "Load balance" scheduling
- Daily automatic summarization
- Multi-device sync via remote DB
- Integration into Clover Hub

---

## 8. Constraints
- The system should run **fully offline except for AI parsing**.
- Everything must be lightweight.
- Everything must be simple to iterate on locally.

---

## 9. Deliverables
- Functional PWA (Nuxt + Tailwind)
- Small backend (Node/FastAPI) for:
  - Parsing endpoint
  - Task CRUD
- SQLite or IndexedDB storage
- Deployment-ready for Clover Hub
