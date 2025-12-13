import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import type { Task, CreateTaskInput, UpdateTaskInput, User, RegisterInput, UserPublic } from './types.js'

// DB path from env or fallback
const dbPath =
  process.env.DB_PATH ??
  path.join(process.cwd(), 'tasks.db')

// Ensure directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    note TEXT NOT NULL,
    date TEXT,
    time TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`)

// Create index for faster user task queries
db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`)

// ==================== USER FUNCTIONS ====================

export const getUserById = (id: string): User | undefined => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
  return stmt.get(id) as User | undefined
}

export const getUserByEmail = (email: string): User | undefined => {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?')
  return stmt.get(email) as User | undefined
}

export const createUser = (input: RegisterInput, passwordHash: string): UserPublic => {
  const id = uuidv4()
  const createdAt = Date.now()

  const stmt = db.prepare(`
    INSERT INTO users (id, email, name, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)

  stmt.run(id, input.email.toLowerCase(), input.name, passwordHash, createdAt)

  return {
    id,
    email: input.email.toLowerCase(),
    name: input.name,
    created_at: createdAt
  }
}

// ==================== TASK FUNCTIONS ====================

export const getAllTasks = (userId: string): Task[] => {
  const stmt = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC')
  return stmt.all(userId) as Task[]
}

export const getTasksByDate = (userId: string, date: string): Task[] => {
  const stmt = db.prepare('SELECT * FROM tasks WHERE user_id = ? AND date = ? ORDER BY time ASC, created_at DESC')
  return stmt.all(userId, date) as Task[]
}

export const getTaskById = (id: string, userId: string): Task | undefined => {
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
  return stmt.get(id, userId) as Task | undefined
}

export const createTask = (input: CreateTaskInput, userId: string): Task => {
  const task: Task = {
    id: uuidv4(),
    user_id: userId,
    title: input.title,
    note: input.note,
    date: input.date,
    time: input.time,
    status: input.status || 'todo',
    created_at: Date.now()
  }

  const stmt = db.prepare(`
    INSERT INTO tasks (id, user_id, title, note, date, time, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(task.id, task.user_id, task.title, task.note, task.date, task.time, task.status, task.created_at)

  return task
}

export const updateTask = (id: string, userId: string, input: UpdateTaskInput): Task | null => {
  const existing = getTaskById(id, userId)
  if (!existing) return null

  const updated: Task = {
    ...existing,
    title: input.title !== undefined ? input.title : existing.title,
    note: input.note !== undefined ? input.note : existing.note,
    date: input.date !== undefined ? input.date : existing.date,
    time: input.time !== undefined ? input.time : existing.time,
    status: input.status !== undefined ? input.status : existing.status
  }

  const stmt = db.prepare(`
    UPDATE tasks SET title = ?, note = ?, date = ?, time = ?, status = ?
    WHERE id = ? AND user_id = ?
  `)

  stmt.run(updated.title, updated.note, updated.date, updated.time, updated.status, id, userId)

  return updated
}

export const deleteTask = (id: string, userId: string): boolean => {
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?')
  const result = stmt.run(id, userId)
  return result.changes > 0
}

export default db
