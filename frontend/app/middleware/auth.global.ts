export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for auth pages
  if (to.path === '/login' || to.path === '/register') {
    return
  }

  const { user, isInitialized, fetchUser } = useAuth()

  // If we haven't checked auth yet, fetch user
  if (!isInitialized.value) {
    await fetchUser()
  }

  // If still no user after fetch, redirect to login
  if (!user.value) {
    return navigateTo('/login')
  }
})
