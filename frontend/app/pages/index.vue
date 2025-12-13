<template>
  <div class="px-4 py-6">
    <!-- Header -->
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Aujourd'hui</h1>
      <p class="text-gray-500 mt-1">{{ formattedDate }}</p>
    </header>

    <!-- Voice Input -->
    <VoiceInput
      placeholder="Qu'avez-vous à faire aujourd'hui ?"
      @task-created="refreshTasks"
      class="mb-6"
    />

    <!-- Tasks List -->
    <section>
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>

      <div v-else-if="todayTasks.length === 0" class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-gray-500">Aucune tâche pour aujourd'hui</p>
        <p class="text-sm text-gray-400 mt-1">Utilisez le micro pour ajouter une tâche</p>
      </div>

      <div v-else class="space-y-3">
        <TaskCard
          v-for="task in todayTasks"
          :key="task.id"
          :task="task"
          @toggle-status="handleToggleStatus(task)"
          @edit="openEditModal(task)"
        />
      </div>
    </section>

    <!-- Done tasks (collapsible) -->
    <section v-if="doneTasks.length > 0" class="mt-8">
      <button
        @click="showDone = !showDone"
        class="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-90': showDone }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="text-sm font-medium">Terminées ({{ doneTasks.length }})</span>
      </button>

      <div v-if="showDone" class="mt-3 space-y-3">
        <TaskCard
          v-for="task in doneTasks"
          :key="task.id"
          :task="task"
          @toggle-status="handleToggleStatus(task)"
          @edit="openEditModal(task)"
        />
      </div>
    </section>

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
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Task } from '~/types/task'

const { tasks, loading, fetchTasks, updateTask, deleteTask } = useTasks()
const { getTodayISO } = useDateUtils()

const showDone = ref(false)

// Modal state
const isEditModalOpen = ref(false)
const selectedTask = ref<Task | null>(null)

const formattedDate = computed(() => {
  return format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })
})

const todayTasks = computed(() => {
  const today = getTodayISO()
  return tasks.value.filter(t => t.date === today && t.status !== 'done')
})

const doneTasks = computed(() => {
  const today = getTodayISO()
  return tasks.value.filter(t => t.date === today && t.status === 'done')
})

const refreshTasks = async () => {
  await fetchTasks()
}

const handleToggleStatus = async (task: Task) => {
  const newStatus = task.status === 'done' ? 'todo' : 'done'
  await updateTask(task.id, { status: newStatus })
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
  refreshTasks()
})
</script>
