import type { Task, CreateTaskInput, UpdateTaskInput, ParsedNote } from '~/types/task'

export const useTasks = () => {
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  const tasks = useState<Task[]>('tasks', () => [])
  const loading = useState<boolean>('tasks-loading', () => false)
  const error = useState<string | null>('tasks-error', () => null)

  const fetchTasks = async (date?: string): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const url = date ? `${API_BASE}/api/tasks?date=${date}` : `${API_BASE}/api/tasks`
      const response = await $fetch<Task[]>(url, {
        credentials: 'include'
      })
      tasks.value = response
    } catch (e) {
      error.value = 'Failed to fetch tasks'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  const createTask = async (input: CreateTaskInput): Promise<Task | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<Task>(`${API_BASE}/api/tasks`, {
        method: 'POST',
        body: input,
        credentials: 'include'
      })
      tasks.value.push(response)
      return response
    } catch (e) {
      error.value = 'Failed to create task'
      console.error(e)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateTask = async (id: string, input: UpdateTaskInput): Promise<Task | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<Task>(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        body: input,
        credentials: 'include'
      })
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = response
      }
      return response
    } catch (e) {
      error.value = 'Failed to update task'
      console.error(e)
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteTask = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      tasks.value = tasks.value.filter(t => t.id !== id)
      return true
    } catch (e) {
      error.value = 'Failed to delete task'
      console.error(e)
      return false
    } finally {
      loading.value = false
    }
  }

  const markAsDone = async (id: string): Promise<Task | null> => {
    return updateTask(id, { status: 'done' })
  }

  const markAsDoing = async (id: string): Promise<Task | null> => {
    return updateTask(id, { status: 'doing' })
  }

  const markAsTodo = async (id: string): Promise<Task | null> => {
    return updateTask(id, { status: 'todo' })
  }

  return {
    tasks: readonly(tasks),
    loading: readonly(loading),
    error: readonly(error),
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    markAsDone,
    markAsDoing,
    markAsTodo
  }
}

export const useParseNote = () => {
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  const loading = useState<boolean>('parse-loading', () => false)
  const error = useState<string | null>('parse-error', () => null)

  const parseNote = async (text: string): Promise<ParsedNote | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<ParsedNote>(`${API_BASE}/api/parse-note`, {
        method: 'POST',
        body: { text },
        credentials: 'include'
      })
      return response
    } catch (e) {
      error.value = 'Failed to parse note'
      console.error(e)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    parseNote
  }
}
