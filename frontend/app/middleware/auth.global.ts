export default defineNuxtRouteMiddleware(async (to) => {
  // Avoid SSR auth redirects: localStorage token is only available on client.
  // The client-side navigation will run this middleware again after hydration.
  if (process.server) {
    return
  }

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
