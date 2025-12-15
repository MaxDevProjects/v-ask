import type { UserPublic, AuthResponse, RegisterInput, LoginInput } from '~/types/task'

export const useAuth = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase || 'http://localhost:3001'

  const user = useState<UserPublic | null>('auth-user', () => null)
  const isInitialized = useState<boolean>('auth-initialized', () => false)
  const error = useState<string | null>('auth-error', () => null)
  const { getAuthHeaders, setToken } = useAuthToken()

  // Local loading state - not shared across components
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  const fetchUser = async (): Promise<void> => {
    try {
      error.value = null

      const response = await fetch(`${apiBase}/api/auth/me`, {
        credentials: 'include',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        user.value = data.user
      } else {
        user.value = null
      }
    } catch (e) {
      console.error('Fetch user error:', e)
      user.value = null
    } finally {
      isInitialized.value = true
    }
  }

  const register = async (input: RegisterInput): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input)
      })

      const data = await response.json()

      if (!response.ok) {
        error.value = data.error || 'Erreur lors de la création du compte'
        return false
      }

      user.value = (data as AuthResponse).user
      setToken((data as AuthResponse).token)
      return true
    } catch (e) {
      console.error('Register error:', e)
      error.value = 'Erreur de connexion au serveur'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const login = async (input: LoginInput): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input)
      })

      const data = await response.json()

      if (!response.ok) {
        error.value = data.error || 'Erreur lors de la connexion'
        return false
      }

      user.value = (data as AuthResponse).user
      setToken((data as AuthResponse).token)
      return true
    } catch (e) {
      console.error('Login error:', e)
      error.value = 'Erreur de connexion au serveur'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await fetch(`${apiBase}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders()
      })
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      user.value = null
      setToken(null)
    }
  }

  return {
    user: readonly(user),
    isLoading,
    isInitialized: readonly(isInitialized),
    error: readonly(error),
    isAuthenticated,
    fetchUser,
    register,
    login,
    logout
  }
}
