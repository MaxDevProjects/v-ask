export type TaskStatus = 'todo' | 'doing' | 'done'

export interface User {
  id: string
  email: string
  name: string
  password_hash: string
  created_at: number
}

export interface UserPublic {
  id: string
  email: string
  name: string
  created_at: number
}

export interface Task {
  id: string
  user_id: string
  title: string
  note: string
  date: string | null
  time: string | null
  status: TaskStatus
  created_at: number
}

export interface CreateTaskInput {
  title: string
  note: string
  date: string | null
  time: string | null
  status?: TaskStatus
}

export interface UpdateTaskInput {
  title?: string
  note?: string
  date?: string | null
  time?: string | null
  status?: TaskStatus
}

export interface ParsedNote {
  title: string
  note: string
  date: string
  time: string
}

export interface ParseNoteRequest {
  text: string
}

export interface RegisterInput {
  email: string
  name: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  user: UserPublic
  token: string
}
