<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { RouterLink, useRouter } from "vue-router"
import { get, post } from "@/api/client"
import type { AdminStats } from "@/api/types"
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

const tabs = computed(() => [
  { id: "dashboard", label: store.t("admin.nav.dashboard") },
  { id: "sites", label: store.t("admin.nav.sites") },
  { id: "incidents", label: store.t("admin.nav.incidents") },
  { id: "settings", label: store.t("admin.nav.settings") },
] as const)

async function load() {
  try {
    const me = await get<{ username: string }>("/api/auth/me")
    username.value = me.username
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
      <HeaderControls />
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
    <SettingsTab v-else />

    <footer class="admin-footer">
      <RouterLink to="/">{{ store.t("admin.back") }}</RouterLink>
      <button class="icon-btn danger-text" @click="logout">{{ store.t("admin.logout") }}</button>
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
}

.admin-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 3rem;
  border-top: 1px solid var(--line);
  padding-top: 1rem;
  font-size: 0.8rem;
}

.danger-text {
  color: var(--down);
}

.danger-text:hover {
  border-color: var(--down);
  color: var(--down);
}
</style>
