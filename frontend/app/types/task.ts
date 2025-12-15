export type TaskStatus = 'todo' | 'doing' | 'done'

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

export interface ParsedNote {
  title: string
  note: string
  date: string | null
  time: string | null
  ai_used?: boolean
  ai_provider?: 'gemini' | 'openai' | 'fallback'
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

// Auth types
export interface UserPublic {
  id: string
  email: string
  name: string
  created_at: number
}

export interface AuthResponse {
  user: UserPublic
  token: string
}

export interface RegisterInput {
  email: string
  password: string
  name: string
}

export interface LoginInput {
  email: string
  password: string
}
