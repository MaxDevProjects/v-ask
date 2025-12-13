<template>
  <div class="flex-shrink-0 w-72 snap-center">
    <div
      class="rounded-2xl p-4 h-full min-h-[300px] transition-colors"
      :class="[bgColorClass, isDragOver ? 'ring-2 ring-primary-400 ring-offset-2' : '']"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- Column Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold" :class="textColorClass">
          {{ title }}
        </h3>
        <span
          class="text-xs font-medium px-2 py-0.5 rounded-full"
          :class="badgeColorClass"
        >
          {{ tasks.length }}
        </span>
      </div>

      <!-- Tasks -->
      <div class="space-y-2">
        <div
          v-for="task in tasks"
          :key="task.id"
          draggable="true"
          class="bg-white rounded-xl p-3 shadow-card cursor-grab active:cursor-grabbing transition-all hover:shadow-md"
          :class="{ 'opacity-50 scale-95': draggingTaskId === task.id }"
          @dragstart="handleDragStart($event, task)"
          @dragend="handleDragEnd"
          @click="$emit('edit', task)"
        >
          <div class="flex items-start gap-2">
            <!-- Checkbox -->
            <button
              @click.stop="$emit('toggle-status', task)"
              class="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 transition-colors"
              :class="[
                task.status === 'done'
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 hover:border-primary-400'
              ]"
            >
              <svg
                v-if="task.status === 'done'"
                class="w-full h-full text-white p-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </button>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-medium text-gray-900 truncate"
                :class="{ 'line-through text-gray-400': task.status === 'done' }"
              >
                {{ task.title }}
              </p>
              <p v-if="task.note" class="text-xs text-gray-500 truncate mt-0.5">
                {{ task.note }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span v-if="task.time" class="text-xs text-gray-400">
                  {{ task.time }}
                </span>
                <span v-if="task.date" class="text-xs text-gray-400">
                  {{ formatDate(task.date) }}
                </span>
              </div>
            </div>

            <!-- Edit icon -->
            <svg class="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <!-- Drop zone placeholder -->
        <div
          v-if="isDragOver && tasks.length === 0"
          class="border-2 border-dashed border-primary-300 rounded-xl p-4 text-center text-primary-500 text-sm"
        >
          Déposer ici
        </div>

        <!-- Empty state -->
        <div
          v-if="tasks.length === 0 && !isDragOver"
          class="text-center py-8 text-gray-400 text-sm"
        >
          Aucune tâche
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task, TaskStatus } from '~/types/task'

interface Props {
  title: string
  tasks: Task[]
  color: 'gray' | 'blue' | 'yellow' | 'green'
  columnStatus: TaskStatus | 'inbox' | 'week'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'toggle-status': [task: Task]
  'delete': [id: string]
  'edit': [task: Task]
  'drop': [taskId: string, targetColumn: TaskStatus | 'inbox' | 'week']
}>()

const { formatDate } = useDateUtils()

const isDragOver = ref(false)
const draggingTaskId = ref<string | null>(null)

const handleDragStart = (event: DragEvent, task: Task) => {
  if (!event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', task.id)
  draggingTaskId.value = task.id
}

const handleDragEnd = () => {
  draggingTaskId.value = null
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  const taskId = event.dataTransfer?.getData('text/plain')
  if (taskId) {
    emit('drop', taskId, props.columnStatus)
  }
}

const bgColorClass = computed(() => {
  const classes = {
    gray: 'bg-gray-100',
    blue: 'bg-blue-50',
    yellow: 'bg-yellow-50',
    green: 'bg-green-50'
  }
  return classes[props.color]
})

const textColorClass = computed(() => {
  const classes = {
    gray: 'text-gray-700',
    blue: 'text-blue-700',
    yellow: 'text-yellow-700',
    green: 'text-green-700'
  }
  return classes[props.color]
})

const badgeColorClass = computed(() => {
  const classes = {
    gray: 'bg-gray-200 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600'
  }
  return classes[props.color]
})
</script>
