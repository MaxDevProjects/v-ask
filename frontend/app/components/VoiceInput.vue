<template>
  <div class="bg-white rounded-2xl shadow-soft p-4">
    <!-- Textarea -->
    <textarea
      v-model="text"
      :placeholder="placeholder"
      class="w-full resize-none border-0 focus:ring-0 text-gray-900 placeholder-gray-400 text-base"
      rows="3"
      @keydown.enter.meta="handleSubmit"
      @keydown.enter.ctrl="handleSubmit"
    />

    <!-- Actions -->
    <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
      <!-- Mic Button -->
      <button
        @click="toggleListening"
        class="p-3 rounded-full transition-all duration-200"
        :class="[
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
        :disabled="!isSupported"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>

      <!-- Submit Button -->
      <button
        @click="handleSubmit"
        :disabled="!text.trim() || loading"
        class="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="loading" class="animate-spin">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </span>
        <span>Créer la tâche</span>
      </button>
    </div>

    <!-- Error message -->
    <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  placeholder?: string
}

withDefaults(defineProps<Props>(), {
  placeholder: 'Décrivez votre tâche...'
})

const emit = defineEmits<{
  'task-created': []
}>()

const text = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const { isSupported, isListening, transcript, toggleListening } = useSpeechRecognition()
const { parseNote } = useParseNote()
const { createTask } = useTasks()

// Watch transcript changes from speech recognition
watch(transcript, (newVal) => {
  if (newVal) {
    text.value = newVal
  }
})

const handleSubmit = async () => {
  if (!text.value.trim() || loading.value) return

  loading.value = true
  error.value = null

  try {
    // Parse the note using AI
    const parsed = await parseNote(text.value)
    
    if (!parsed) {
      error.value = 'Impossible de parser la note'
      return
    }

    // Create the task
    const task = await createTask({
      title: parsed.title,
      note: parsed.note,
      date: parsed.date,
      time: parsed.time,
      status: 'todo'
    })

    if (task) {
      text.value = ''
      emit('task-created')
    } else {
      error.value = 'Impossible de créer la tâche'
    }
  } catch (e) {
    error.value = 'Une erreur est survenue'
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>
