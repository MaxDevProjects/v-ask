export const useAuthToken = () => {
  const token = useState<string | null>('auth-token', () => null)

  const readFromStorage = (): string | null => {
    if (!process.client) return null
    return localStorage.getItem('auth-token')
  }

  const writeToStorage = (value: string | null): void => {
    if (!process.client) return
    if (value) localStorage.setItem('auth-token', value)
    else localStorage.removeItem('auth-token')
  }

  const ensureLoaded = (): void => {
    if (token.value) return
    const stored = readFromStorage()
    if (stored) token.value = stored
  }

  const setToken = (value: string | null): void => {
    token.value = value
    writeToStorage(value)
  }

  const getAuthHeaders = (): HeadersInit => {
    ensureLoaded()
    if (!token.value) return {}
    return { Authorization: `Bearer ${token.value}` }
  }

  return {
    token: readonly(token),
    ensureLoaded,
    setToken,
    getAuthHeaders
  }
}

