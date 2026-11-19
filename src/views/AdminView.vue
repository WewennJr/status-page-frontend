<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { RouterLink, useRouter } from "vue-router"
import { get, post } from "@/api/client"
import HeaderControls from "@/components/HeaderControls.vue"
import DashboardTab from "@/components/admin/DashboardTab.vue"
import IncidentsTab from "@/components/admin/IncidentsTab.vue"
import SettingsTab from "@/components/admin/SettingsTab.vue"
import SitesTab from "@/components/admin/SitesTab.vue"
import { useAppStore } from "@/stores/app"

const store = useAppStore()
const router = useRouter()

const tab = ref<"dashboard" | "sites" | "incidents" | "settings">("dashboard")
const username = ref("")
const footerText = ref("")

const tabs = computed(() => [
  { id: "dashboard", label: store.t("admin.nav.dashboard") },
  { id: "sites", label: store.t("admin.nav.sites") },
  { id: "incidents", label: store.t("admin.nav.incidents") },
  { id: "settings", label: store.t("admin.nav.settings") },
] as const)

async function load() {
  try {
    const me = await get<{ authenticated: boolean; username: string | null }>(
      "/api/auth/me",
    )
    if (!me.authenticated) {
      router.replace({ name: "login", query: { redirect: "/admin" } })
      return
    }
    username.value = me.username ?? ""
    const settings = await get<Record<string, string>>("/api/admin/settings")
    footerText.value = settings.footer_text ?? ""
  } catch {
    router.replace({ name: "login", query: { redirect: "/admin" } })
  }
}

async function logout() {
  try {
    await post("/api/auth/logout")
  } finally {
    router.push({ name: "status" })
  }
}

onMounted(load)
</script>

<template>
  <div class="container">
    <header class="page-header">
      <div class="brand">
        <span class="brand-icon">⚙</span>
        {{ store.t("admin.title") }} — {{ username }}
      </div>
      <div class="header-actions">
        <button
          class="icon-btn danger"
          :title="store.t('admin.logout')"
          :aria-label="store.t('admin.logout')"
          @click="logout"
        >
          ⏻
        </button>
        <HeaderControls />
      </div>
    </header>

    <nav class="admin-nav">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="nav-btn mono"
        :class="{ active: tab === t.id }"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </nav>

    <DashboardTab v-if="tab === 'dashboard'" @goto="(t: 'dashboard' | 'sites' | 'incidents' | 'settings') => (tab = t)" />
    <SitesTab v-else-if="tab === 'sites'" />
    <IncidentsTab v-else-if="tab === 'incidents'" />
    <SettingsTab v-else @account-updated="(name: string) => (username = name)" />

    <footer class="page-footer admin-footer">
      <span>{{ footerText }}</span>
      <RouterLink to="/">{{ store.t("admin.back") }}</RouterLink>
    </footer>
  </div>
</template>

<style scoped>
.admin-nav {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1.8rem;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.6rem;
  flex-wrap: wrap;
}

.nav-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 3px;
  color: var(--muted);
  font-size: 0.66rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 0.45rem 0.8rem;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.nav-btn:hover {
  color: var(--text);
  border-color: var(--line-strong);
}

.nav-btn.active {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.admin-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>
