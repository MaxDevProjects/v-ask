<template>
  <div class="px-4 py-6">
    <!-- Header -->
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Calendrier</h1>
    </header>

    <!-- Week Selector -->
    <div class="bg-white rounded-2xl shadow-soft p-4 mb-6">
      <div class="flex justify-between items-center mb-4">
        <button
          @click="previousWeek"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="font-medium text-gray-900">{{ weekLabel }}</span>
        <button
          @click="nextWeek"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Day Picker -->
      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="day in weekDays"
          :key="day.dateISO"
          @click="selectDate(day.dateISO)"
          class="flex flex-col items-center py-2 rounded-xl transition-all duration-150"
          :class="[
            selectedDate === day.dateISO
              ? 'bg-primary-500 text-white'
              : day.isToday
                ? 'bg-primary-50 text-primary-600'
                : 'hover:bg-gray-100 text-gray-700'
          ]"
        >
          <span class="text-xs uppercase">{{ day.dayName }}</span>
          <span class="text-lg font-semibold mt-1">{{ day.dayNumber }}</span>
          <!-- Task indicator -->
          <div
            v-if="getTaskCountForDate(day.dateISO) > 0"
            class="w-1.5 h-1.5 rounded-full mt-1"
            :class="[
              selectedDate === day.dateISO ? 'bg-white' : 'bg-primary-500'
            ]"
          />
        </button>
      </div>
    </div>

    <!-- Selected Day Tasks -->
    <section>
      <h2 class="text-lg font-semibold text-gray-900 mb-4">
        {{ selectedDateLabel }}
      </h2>

      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>

      <div v-else-if="selectedDateTasks.length === 0" class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p class="text-gray-500">Aucune tâche ce jour</p>
      </div>

      <div v-else class="space-y-3">
        <TaskCard
          v-for="task in selectedDateTasks"
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
import { format, addWeeks, subWeeks, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Task } from '~/types/task'

const { tasks, loading, fetchTasks, updateTask, deleteTask } = useTasks()
const { getWeekDays, getTodayISO, formatDate } = useDateUtils()

const currentWeekStart = ref(startOfWeek(new Date(), { weekStartsOn: 1 }))
const selectedDate = ref(getTodayISO())

// Modal state
const isEditModalOpen = ref(false)
const selectedTask = ref<Task | null>(null)

const weekDays = computed(() => getWeekDays(currentWeekStart.value))

const weekLabel = computed(() => {
  return format(currentWeekStart.value, 'MMMM yyyy', { locale: fr })
})

const selectedDateLabel = computed(() => {
  return formatDate(selectedDate.value)
})

const selectedDateTasks = computed(() => {
  return tasks.value.filter(t => t.date === selectedDate.value)
})

const getTaskCountForDate = (date: string) => {
  return tasks.value.filter(t => t.date === date && t.status !== 'done').length
}

const selectDate = (date: string) => {
  selectedDate.value = date
}

const previousWeek = () => {
  currentWeekStart.value = subWeeks(currentWeekStart.value, 1)
}

const nextWeek = () => {
  currentWeekStart.value = addWeeks(currentWeekStart.value, 1)
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
  fetchTasks()
})
</script>
