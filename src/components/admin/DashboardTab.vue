<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { get } from "@/api/client"
import type { AdminStats, HistoryPoint, UptimeBar } from "@/api/types"
import ResponseChart from "@/components/ResponseChart.vue"
import StatusBadge from "@/components/StatusBadge.vue"
import UptimeBars from "@/components/UptimeBars.vue"
import { useAppStore } from "@/stores/app"

const store = useAppStore()
const stats = ref<AdminStats | null>(null)
const loading = ref(true)

const emit = defineEmits<{
  (e: "goto", tab: "dashboard" | "sites" | "incidents" | "settings"): void
}>()

const cards = computed(() => [
  {
    key: "monitors",
    label: store.t("admin.stats.monitors"),
    value: stats.value?.monitors ?? null,
    detail: stats.value
      ? `${stats.value.monitors_up} ${store.t("status.up").toLowerCase()} · ${stats.value.monitors_down} ${store.t("status.down").toLowerCase()}`
      : "",
    tab: "sites",
  },
  {
    key: "checks",
    label: store.t("admin.stats.checks-24h"),
    value: stats.value?.checks_24h ?? null,
    detail: stats.value
      ? `${stats.value.checks_stored} ${store.t("admin.stats.checks").toLowerCase()}`
      : "",
    tab: "sites",
  },
  {
    key: "response",
    label: store.t("admin.stats.avg-response"),
    value: stats.value?.avg_response_ms_24h != null ? `${Math.round(stats.value.avg_response_ms_24h)} ms` : "—",
    detail: "",
    tab: "sites",
  },
  {
    key: "incidents",
    label: store.t("admin.stats.incidents"),
    value: stats.value?.open_incidents ?? null,
    detail: stats.value ? `${stats.value.incidents_30d} / 30 j` : "",
    tab: "incidents",
  },
] as const)

const uptimeBars = computed<UptimeBar[]>(() => stats.value?.uptime_series ?? [])
const uptimeDays = 30
const responsePoints = computed<HistoryPoint[]>(() => stats.value?.response_series ?? [])
const hasUptime = computed(() => uptimeBars.value.length > 0)

function fmtUptime(ratio: number | null): string {
  if (ratio == null) return "—"
  return `${(ratio * 100).toFixed(ratio === 1 ? 0 : 2)}%`
}

onMounted(async () => {
  try {
    stats.value = await get<AdminStats>("/api/admin/stats")
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="stat-grid">
      <button
        v-for="card in cards"
        :key="card.key"
        class="card stat-card"
        @click="emit('goto', card.tab)"
      >
        <span class="stat-value mono">{{ loading ? "…" : (card.value ?? "—") }}</span>
        <span class="stat-label">{{ card.label }}</span>
        <span v-if="card.detail" class="stat-detail mono">{{ card.detail }}</span>
      </button>
    </div>

    <h2 class="section-title">{{ store.t("admin.stats.uptime-title") }}</h2>
    <div v-if="hasUptime" class="card chart-card">
      <UptimeBars :bars="uptimeBars" :days="uptimeDays" />
      <p class="mono muted chart-caption">
        {{ uptimeDays }} {{ store.t("common.days") }}
      </p>
    </div>
    <p v-else class="muted empty">{{ store.t("monitor.no-data") }}</p>

    <h2 class="section-title">{{ store.t("admin.stats.response-title") }}</h2>
    <ResponseChart :points="responsePoints" :height="160" />

    <h2 class="section-title">{{ store.t("admin.stats.monitors-title") }}</h2>
    <p v-if="!stats?.monitor_statuses.length" class="muted empty">
      {{ store.t("admin.stats.no-monitors") }}
    </p>
    <div v-else class="monitor-status-list">
      <button
        v-for="m in stats.monitor_statuses"
        :key="m.id"
        class="monitor-status-row"
        @click="emit('goto', 'sites')"
      >
        <span class="status-name">{{ m.name }}</span>
        <span class="mono muted status-group">{{ m.group_name }}</span>
        <span class="mono muted status-uptime">{{ fmtUptime(m.uptime_ratio) }}</span>
        <span class="mono muted status-rt">
          {{ m.response_time_ms != null ? `${Math.round(m.response_time_ms)} ms` : "—" }}
        </span>
        <StatusBadge :status="m.status" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.9rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  padding: 1.3rem 1.3rem 1.1rem;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.stat-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.stat-value {
  font-size: 1.9rem;
  line-height: 1.1;
  color: var(--accent);
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.stat-detail {
  font-size: 0.6rem;
  letter-spacing: 0.06em;
  color: var(--muted);
  opacity: 0.8;
}

.chart-card {
  padding: 1.2rem 1.3rem;
}

.chart-caption {
  margin: 0.6rem 0 0;
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.monitor-status-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 4px;
  overflow: hidden;
}

.monitor-status-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.7fr 0.7fr auto;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  padding: 0.75rem 1.1rem;
  background: var(--panel);
  border: 0;
  border-bottom: 1px solid var(--line);
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.monitor-status-row:last-child {
  border-bottom: 0;
}

.monitor-status-row:hover {
  background: var(--panel-soft);
}

.status-name {
  font-size: 0.9rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-group,
.status-uptime,
.status-rt {
  font-size: 0.68rem;
  letter-spacing: 0.06em;
}

@media (max-width: 640px) {
  .monitor-status-row {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "name badge"
      "meta meta";
  }
  .status-name {
    grid-area: name;
  }
  .status-group,
  .status-uptime,
  .status-rt {
    display: none;
  }
  .monitor-status-row :deep(.status-badge) {
    grid-area: badge;
    justify-self: end;
  }
}
</style>
