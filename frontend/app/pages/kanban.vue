<template>
  <div class="px-4 py-6">
    <!-- Header -->
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Kanban</h1>
      <p class="text-sm text-gray-500 mt-1">Glissez-déposez pour réorganiser</p>
    </header>

    <!-- Kanban Columns (horizontal scroll on mobile) -->
    <div class="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
      <!-- Inbox Column -->
      <KanbanColumn
        title="Inbox"
        :tasks="inboxTasks"
        color="gray"
        column-status="inbox"
        @toggle-status="handleToggleStatus"
        @edit="openEditModal"
        @drop="handleDrop"
      />

      <!-- This Week Column -->
      <KanbanColumn
        title="Cette semaine"
        :tasks="thisWeekTasks"
        color="blue"
        column-status="week"
        @toggle-status="handleToggleStatus"
        @edit="openEditModal"
        @drop="handleDrop"
      />

      <!-- In Progress Column -->
      <KanbanColumn
        title="En cours"
        :tasks="inProgressTasks"
        color="yellow"
        column-status="doing"
        @toggle-status="handleToggleStatus"
        @edit="openEditModal"
        @drop="handleDrop"
      />

      <!-- Done Column -->
      <KanbanColumn
        title="Terminées"
        :tasks="doneTasks"
        color="green"
        column-status="done"
        @toggle-status="handleToggleStatus"
        @edit="openEditModal"
        @drop="handleDrop"
      />
    </div>

    <!-- Edit Modal -->
    <TaskEditModal
      :is-open="isEditModalOpen"
      :task="selectedTask"
      @close="closeEditModal"
      @save="handleSaveTask"
      @delete="handleDeleteTask"
    />
  </div>
</template>

<script setup lang="ts">
import type { Task, TaskStatus } from '~/types/task'

const { tasks, loading, fetchTasks, updateTask, deleteTask } = useTasks()
const { getTodayISO, isDateThisWeek } = useDateUtils()

// Modal state
const isEditModalOpen = ref(false)
const selectedTask = ref<Task | null>(null)

// Inbox: tasks without scheduled date
const inboxTasks = computed(() => {
  return tasks.value.filter(t => !t.date && t.status !== 'done')
})

// This week: scheduled between today and today+6, not doing or done
const thisWeekTasks = computed(() => {
  return tasks.value.filter(t => 
    t.date && 
    isDateThisWeek(t.date) && 
    t.status === 'todo'
  )
})

// In progress: status == "doing"
const inProgressTasks = computed(() => {
  return tasks.value.filter(t => t.status === 'doing')
})

// Done: completed tasks
const doneTasks = computed(() => {
  return tasks.value.filter(t => t.status === 'done')
})

const handleToggleStatus = async (task: Task) => {
  const newStatus = task.status === 'done' ? 'todo' : 'done'
  await updateTask(task.id, { status: newStatus })
}

const handleDrop = async (taskId: string, targetColumn: TaskStatus | 'inbox' | 'week') => {
  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return

  let updates: { status?: TaskStatus; date?: string | null } = {}

  switch (targetColumn) {
    case 'inbox':
      // Remove date, set to todo
      updates = { date: null, status: 'todo' }
      break
    case 'week':
      // Set date to today if no date, status to todo
      updates = { 
        date: task.date || getTodayISO(), 
        status: 'todo' 
      }
      break
    case 'doing':
      updates = { status: 'doing' }
      break
    case 'done':
      updates = { status: 'done' }
      break
    default:
      updates = { status: targetColumn }
  }

  await updateTask(taskId, updates)
}

const openEditModal = (task: Task) => {
  selectedTask.value = task
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedTask.value = null
}

const handleSaveTask = async (task: Task) => {
  await updateTask(task.id, {
    title: task.title,
    note: task.note,
    date: task.date,
    time: task.time,
    status: task.status
  })
  closeEditModal()
}

const handleDeleteTask = async (id: string) => {
  await deleteTask(id)
  closeEditModal()
}

onMounted(() => {
  fetchTasks()
})
</script>
