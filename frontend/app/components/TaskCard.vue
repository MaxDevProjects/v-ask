<template>
  <div 
    class="task-card group cursor-pointer"
    @click="$emit('edit')"
  >
    <div class="flex items-start gap-3">
      <!-- Checkbox -->
      <button
        @click.stop="$emit('toggle-status')"
        class="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 transition-colors duration-150"
        :class="[
          task.status === 'done'
            ? 'bg-primary-500 border-primary-500'
            : task.status === 'doing'
              ? 'border-primary-500 bg-primary-100'
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
        <h3
          class="font-semibold text-gray-900 truncate"
          :class="{ 'line-through text-gray-400': task.status === 'done' }"
        >
          {{ task.title }}
        </h3>
        <p
          v-if="task.note"
          class="text-sm text-gray-500 truncate mt-0.5"
          :class="{ 'line-through': task.status === 'done' }"
        >
          {{ task.note }}
        </p>
        <div class="flex items-center gap-2 mt-2">
          <span
            v-if="task.time"
            class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full"
          >
            {{ task.time }}
          </span>
          <span
            v-if="showDate && task.date"
            class="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full"
          >
            {{ formatDate(task.date) }}
          </span>
          <span
            v-if="task.status === 'doing'"
            class="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full"
          >
            En cours
          </span>
        </div>
      </div>

      <!-- Edit indicator -->
      <div class="flex-shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/types/task'

interface Props {
  task: Task
  showDate?: boolean
}

defineProps<Props>()
defineEmits<{
  'toggle-status': []
  'edit': []
}>()

const { formatDate } = useDateUtils()
</script>
