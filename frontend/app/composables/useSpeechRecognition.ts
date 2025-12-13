export const useSpeechRecognition = () => {
  const isSupported = useState<boolean>('speech-supported', () => false)
  const isListening = useState<boolean>('speech-listening', () => false)
  const transcript = useState<string>('speech-transcript', () => '')
  const error = useState<string | null>('speech-error', () => null)

  let recognition: SpeechRecognition | null = null

  const initRecognition = () => {
    if (typeof window === 'undefined') return

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      isSupported.value = false
      return
    }

    isSupported.value = true
    recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'fr-FR' // Default to French, can be made configurable

    recognition.onstart = () => {
      isListening.value = true
      error.value = null
    }

    recognition.onend = () => {
      isListening.value = false
    }

    recognition.onerror = (event) => {
      error.value = event.error
      isListening.value = false
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      transcript.value = finalTranscript || interimTranscript
    }
  }

  const startListening = () => {
    if (!recognition) {
      initRecognition()
    }
    if (recognition && !isListening.value) {
      transcript.value = ''
      recognition.start()
    }
  }

  const stopListening = () => {
    if (recognition && isListening.value) {
      recognition.stop()
    }
  }

  const toggleListening = () => {
    if (isListening.value) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Initialize on mount
  onMounted(() => {
    initRecognition()
  })

  return {
    isSupported: readonly(isSupported),
    isListening: readonly(isListening),
    transcript,
    error: readonly(error),
    startListening,
    stopListening,
    toggleListening
  }
}
