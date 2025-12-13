<template>
  <Modal :is-open="isOpen" title="Détails de la tâche" @close="$emit('close')">
    <div v-if="task" class="space-y-4">
      <!-- Title -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Titre</label>
        <input
          v-model="editedTask.title"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          placeholder="Titre de la tâche"
        />
      </div>

      <!-- Note -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Note</label>
        <textarea
          v-model="editedTask.note"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
          placeholder="Description de la tâche"
        />
      </div>

      <!-- Date & Time -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            v-model="editedTask.date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Heure</label>
          <input
            v-model="editedTask.time"
            type="time"
            class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      <!-- Status -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
        <div class="flex gap-2">
          <button
            v-for="status in statuses"
            :key="status.value"
            @click="editedTask.status = status.value"
            class="flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            :class="[
              editedTask.status === status.value
                ? status.activeClass
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
          >
            {{ status.label }}
          </button>
        </div>
      </div>

      <!-- Metadata -->
      <div class="pt-4 border-t border-gray-100">
        <p class="text-xs text-gray-400">
          Créée le {{ formatCreatedAt(task.created_at) }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <button
          @click="handleDelete"
          class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          Supprimer
        </button>
        <div class="flex-1" />
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Annuler
        </button>
        <button
          @click="handleSave"
          class="btn-primary"
          :disabled="saving"
        >
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import type { Task, TaskStatus } from '~/types/task'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  isOpen: boolean
  task: Task | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [task: Task]
  delete: [id: string]
}>()

const saving = ref(false)

const statuses = [
  { value: 'todo' as TaskStatus, label: 'À faire', activeClass: 'bg-gray-200 text-gray-800' },
  { value: 'doing' as TaskStatus, label: 'En cours', activeClass: 'bg-yellow-100 text-yellow-800' },
  { value: 'done' as TaskStatus, label: 'Terminée', activeClass: 'bg-green-100 text-green-800' }
]

const editedTask = ref<Partial<Task>>({})

// Sync edited task when task prop changes
watch(() => props.task, (newTask) => {
  if (newTask) {
    editedTask.value = { ...newTask }
  }
}, { immediate: true })

const formatCreatedAt = (timestamp: number) => {
  return format(new Date(timestamp), "d MMMM yyyy 'à' HH:mm", { locale: fr })
}

const handleSave = async () => {
  if (!props.task) return
  
  saving.value = true
  try {
    emit('save', editedTask.value as Task)
  } finally {
    saving.value = false
  }
}

const handleDelete = () => {
  if (!props.task) return
  emit('delete', props.task.id)
}
</script>
