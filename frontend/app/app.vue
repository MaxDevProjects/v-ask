<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Header with user info (only shown when authenticated) -->
    <header v-if="isAuthenticated && !isAuthPage" class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
        <h1 class="text-lg font-semibold text-gray-900">🎤 v-ask</h1>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600">{{ user?.name }}</span>
          <button
            @click="handleLogout"
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            title="Déconnexion"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-lg mx-auto">
      <NuxtPage />
    </main>

    <!-- Bottom Navigation (only shown when authenticated) -->
    <nav v-if="isAuthenticated && !isAuthPage" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div class="max-w-lg mx-auto flex justify-around">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.path"
          :to="tab.path"
          class="flex flex-col items-center py-3 px-6 transition-colors duration-150"
          :class="[
            $route.path === tab.path
              ? 'text-primary-600'
              : 'text-gray-400 hover:text-gray-600'
          ]"
        >
          <component :is="tab.icon" class="w-6 h-6" />
          <span class="text-xs mt-1 font-medium">{{ tab.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import IconToday from '~/components/icons/IconToday.vue'
import IconCalendar from '~/components/icons/IconCalendar.vue'
import IconKanban from '~/components/icons/IconKanban.vue'

const route = useRoute()
const router = useRouter()
const { user, isAuthenticated, logout } = useAuth()

const tabs = [
  { path: '/', label: "Aujourd'hui", icon: IconToday },
  { path: '/calendar', label: 'Calendrier', icon: IconCalendar },
  { path: '/kanban', label: 'Kanban', icon: IconKanban }
]

const isAuthPage = computed(() => 
  route.path === '/login' || route.path === '/register'
)

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
