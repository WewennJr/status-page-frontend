<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { get } from "@/api/client"
import type { HistoryPoint, IncidentPublic, MonitorPublic, PublicOverview } from "@/api/types"
import HeaderControls from "@/components/HeaderControls.vue"
import ResponseChart from "@/components/ResponseChart.vue"
import StatusBadge from "@/components/StatusBadge.vue"
import UptimeBars from "@/components/UptimeBars.vue"
import { useAppStore } from "@/stores/app"

const store = useAppStore()
const overview = ref<PublicOverview | null>(null)
const loading = ref(true)
const error = ref(false)
const showIncidentHistory = ref(false)
const incidentHistory = ref<IncidentPublic[]>([])

const historyDays = computed(() =>
  parseInt(overview.value?.settings["history_days"] ?? "90", 10) || 90,
)
const showIncidentsHistory = computed(
  () => (overview.value?.settings["show_incidents_history"] ?? "true") !== "false",
)
const showUptimeByDefault = computed(
  () => (overview.value?.settings["default_show_uptime"] ?? "true") !== "false",
)
const showResponseByDefault = computed(
  () => (overview.value?.settings["default_show_response_time"] ?? "true") !== "false",
)
const siteUrl = computed(() => overview.value?.settings["site_url"] ?? "")
const siteIcon = computed(() => overview.value?.settings["site_icon"] ?? "")
const siteName = computed(
  () => overview.value?.settings["site_name"] ?? store.t("app.title"),
)

function showUptime(m: MonitorPublic): boolean {
  return showUptimeByDefault.value && m.show_uptime
}

function showResponseTime(m: MonitorPublic): boolean {
  return showResponseByDefault.value && m.show_response_time
}

interface Grouped {
  name: string
  monitors: MonitorPublic[]
}

const groups = computed<Grouped[]>(() => {
  if (!overview.value) return []
  const map = new Map<string, MonitorPublic[]>()
  for (const m of overview.value.monitors) {
    const key = m.group_name || store.t("group.services")
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }
  return [...map.entries()].map(([name, monitors]) => ({ name, monitors }))
})

const anyDown = computed(() =>
  overview.value?.monitors.some((m) => m.status === "down") ?? false,
)
const anyCheck = computed(() =>
  overview.value?.monitors.some((m) => m.status !== "unknown") ?? false,
)

const bannerClass = computed(() =>
  anyDown.value ? "down" : anyCheck.value ? "up" : "unknown",
)
const bannerText = computed(() =>
  anyDown.value
    ? store.t("banner.some-down")
    : anyCheck.value
      ? store.t("banner.all-ok")
      : store.t("banner.unknown"),
)

/* extended history (chart) per monitor */
const chartRange = ref(1) // 1 | 7 | 30 | 90
const chartPoints = ref<Record<number, HistoryPoint[]>>({})
const expanded = ref<Set<number>>(new Set())

function toggleExpanded(id: number) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

async function loadCharts() {
  if (!overview.value) return
  for (const m of overview.value.monitors) {
    if (!showResponseTime(m) || !expanded.value.has(m.id)) continue
    try {
      chartPoints.value[m.id] = await get<HistoryPoint[]>(
        `/api/public/monitor/${m.id}/history?days=${chartRange.value}`,
      )
    } catch {
      chartPoints.value[m.id] = []
    }
  }
}

watch([expanded, chartRange], () => void loadCharts())

async function loadHistory() {
  try {
    incidentHistory.value = await get<IncidentPublic[]>("/api/public/incidents?limit=25")
  } catch {
    incidentHistory.value = []
  }
}

watch(showIncidentHistory, (v) => {
  if (v) void loadHistory()
})

async function refresh() {
  try {
    overview.value = await get<PublicOverview>("/api/public/overview")
    store.ingestSettings(overview.value.settings)
    error.value = false
    if (overview.value.setup_done === false && window.location.pathname !== "/setup") {
      window.location.href = "/setup"
      return
    }
    await loadCharts()
    if (showIncidentHistory.value) await loadHistory()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

let timer: number | undefined
onMounted(() => {
  void refresh()
  timer = window.setInterval(refresh, 20000)
})
onUnmounted(() => window.clearInterval(timer))

function fmtTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(store.lang === "fr" ? "fr-FR" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function fmtUptime(ratio: number | null): string {
  if (ratio == null) return "—"
  return `${(ratio * 100).toFixed(ratio === 1 ? 0 : 2)}%`
}

function fmtMs(ms: number | null): string {
  if (ms == null) return "—"
  return `${Math.round(ms)} ms`
}
</script>

<template>
  <div class="container">
    <header class="page-header">
      <a
        v-if="siteUrl"
        class="brand brand-link"
        :href="siteUrl"
        target="_blank"
        rel="noopener"
      >
        <span v-if="siteIcon && !siteIcon.startsWith('http')" class="brand-icon">{{ siteIcon }}</span>
        {{ siteName }}
      </a>
      <div v-else class="brand">
        <span v-if="siteIcon && !siteIcon.startsWith('http')" class="brand-icon">{{ siteIcon }}</span>
        {{ siteName }}
      </div>
      <HeaderControls />
    </header>

    <div v-if="loading" class="loading muted">{{ store.t("common.loading") }}</div>

    <template v-else>
      <div class="global-banner" :class="bannerClass">
        <StatusBadge :status="anyDown ? 'down' : anyCheck ? 'up' : 'unknown'" />
        <span>{{ bannerText }}</span>
      </div>

      <h1 class="display">{{ siteName }}</h1>
      <p v-if="overview?.settings['welcome_text']" class="welcome-text">
        {{ overview.settings["welcome_text"] }}
      </p>

      <!-- Active incidents -->
      <template v-if="overview?.active_incidents.length">
        <h2 class="section-title">{{ store.t("incidents.active") }}</h2>
        <article
          v-for="incident in overview.active_incidents"
          :key="incident.id"
          class="card lisered incident-card"
        >
          <div class="incident-head">
            <h3>{{ incident.title }}</h3>
            <span class="grade-badge">
              {{ store.t("incidents.status." + incident.status) }}
            </span>
          </div>
          <p class="muted incident-meta">
            {{ store.t("incident.linked-to") }} :
            {{ incident.monitor_name ?? store.t("incident.all-services") }}
            · {{ fmtTime(incident.created_at) }}
          </p>
          <ul class="incident-updates">
            <li v-for="(u, i) in [...incident.updates].reverse()" :key="i">
              <span v-if="u.status" class="grade-badge subtle">
                {{ store.t("incidents.status." + u.status) }}
              </span>
              <span class="mono muted update-time">{{ fmtTime(u.created_at) }}</span>
              <p>{{ u.message }}</p>
            </li>
          </ul>
        </article>
      </template>

      <!-- Grouped monitors -->
      <section v-for="group in groups" :key="group.name">
        <h2 class="section-title">{{ group.name }}</h2>
        <article v-for="m in group.monitors" :key="m.id" class="card monitor-card">
          <div class="monitor-head">
            <div class="monitor-info">
              <h3>{{ m.name }}</h3>
              <p v-if="m.description" class="muted">{{ m.description }}</p>
            </div>
            <div class="monitor-meta">
              <span v-if="showUptime(m)" class="mono meta-value">
                {{ store.t("monitor.uptime") }} {{ fmtUptime(m.uptime_ratio) }}
              </span>
              <button
                v-if="showResponseTime(m)"
                class="icon-btn small"
                @click="toggleExpanded(m.id)"
              >
                {{ expanded.has(m.id) ? "−" : "+" }} {{ store.t("monitor.response-time") }}
              </button>
              <StatusBadge :status="m.status" />
            </div>
          </div>

          <div v-if="showUptime(m)" class="monitor-bars">
            <UptimeBars :bars="m.bars" :days="historyDays" />
            <div class="mono muted bars-caption">
              {{ historyDays }} {{ store.t("common.days") }}
            </div>
          </div>

          <div v-if="showResponseTime(m) && expanded.has(m.id)" class="monitor-chart">
            <div class="chart-controls mono muted">
              <button
                v-for="d in [1, 7, 30, 90]"
                :key="d"
                class="icon-btn small"
                :class="{ active: chartRange === d }"
                @click="chartRange = d"
              >
                {{ store.t("history." + d + "d") }}
              </button>
              <span class="meta-value">
                {{ store.t("monitor.last-check") }} : {{ fmtTime(m.last_check_at) }}
                · {{ store.t("monitor.avg") }} {{ fmtMs(m.response_time_ms) }}
              </span>
            </div>
            <ResponseChart :points="chartPoints[m.id] ?? []" />
          </div>
        </article>
      </section>

      <!-- Resolved incident history -->
      <template v-if="showIncidentsHistory">
        <h2 class="section-title">{{ store.t("incidents.history") }}</h2>
        <button class="icon-btn" @click="showIncidentHistory = !showIncidentHistory">
          {{ showIncidentHistory ? store.t("incidents.hide-history") : store.t("incidents.show-history") }}
        </button>
      </template>
      <template v-if="showIncidentsHistory && showIncidentHistory">
        <p v-if="!incidentHistory.length" class="muted">{{ store.t("incidents.none") }}</p>
        <article v-for="incident in incidentHistory" :key="incident.id" class="card incident-card">
          <div class="incident-head">
            <h3>{{ incident.title }}</h3>
            <span class="grade-badge">
              {{ store.t("incidents.status.resolved") }}
            </span>
          </div>
          <p class="muted incident-meta">
            {{ incident.monitor_name ?? store.t("incident.all-services") }}
            · {{ fmtTime(incident.created_at) }} → {{ fmtTime(incident.resolved_at) }}
          </p>
          <ul class="incident-updates">
            <li v-for="(u, i) in [...incident.updates].reverse()" :key="i">
              <span v-if="u.status" class="grade-badge subtle">
                {{ store.t("incidents.status." + u.status) }}
              </span>
              <span class="mono muted update-time">{{ fmtTime(u.created_at) }}</span>
              <p>{{ u.message }}</p>
            </li>
          </ul>
        </article>
      </template>
    </template>

    <footer class="page-footer">
      {{ overview?.settings["footer_text"] ?? store.t("footer.powered") }}
    </footer>
  </div>
</template>

<style scoped>
.brand-link {
  border-bottom: 0;
  padding-bottom: 0;
}

.loading {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  padding: 4rem 0;
  text-align: center;
}

.global-banner.unknown {
  border-left-color: var(--muted);
  background: transparent;
}

.global-banner .status-badge {
  flex-shrink: 0;
}

.monitor-card {
  margin-bottom: 0.9rem;
}

.monitor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
}

.monitor-info h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.monitor-info p {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
}

.monitor-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.meta-value {
  font-size: 0.68rem;
  letter-spacing: 0.08em;
}

.monitor-bars {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.bars-caption {
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.monitor-chart {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.chart-controls .active {
  color: var(--accent-ink);
  background: var(--accent);
  border-color: var(--accent);
}

.incident-card {
  margin-bottom: 0.9rem;
}

.incident-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.incident-head h3 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 1.2rem;
}

.incident-meta {
  font-size: 0.78rem;
  margin: 0.25rem 0 0.8rem;
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
}

.incident-updates {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.incident-updates li {
  border-top: 1px solid var(--line);
  padding-top: 0.7rem;
}

.incident-updates p {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
}

.update-time {
  font-size: 0.66rem;
  margin-left: 0.5rem;
  letter-spacing: 0.06em;
}
</style>
