<script setup lang="ts">
import { onMounted, ref } from "vue"
import { get } from "@/api/client"
import type { AdminStats } from "@/api/types"
import { useAppStore } from "@/stores/app"

const store = useAppStore()
const stats = ref<AdminStats | null>(null)

const emit = defineEmits<{
  (e: "goto", tab: "dashboard" | "sites" | "incidents" | "settings"): void
}>()

onMounted(async () => {
  try {
    stats.value = await get<AdminStats>("/api/admin/stats")
  } catch {
    stats.value = null
  }
})

const cards = [
  { key: "monitors", labelKey: "admin.stats.monitors", tab: "sites" },
  { key: "checks_stored", labelKey: "admin.stats.checks", tab: "sites" },
  { key: "open_incidents", labelKey: "admin.stats.incidents", tab: "incidents" },
] as const
</script>

<template>
  <div class="stat-grid">
    <button
      v-for="card in cards"
      :key="card.key"
      class="card stat-card"
      @click="emit('goto', card.tab)"
    >
      <span class="stat-value mono">{{ stats?.[card.key] ?? "—" }}</span>
      <span class="stat-label">{{ store.t(card.labelKey) }}</span>
    </button>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.9rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition: border-color 0.15s ease;
}

.stat-card:hover {
  border-color: var(--accent);
}

.stat-value {
  font-size: 2rem;
  color: var(--accent);
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}
</style>
