<script setup lang="ts">
import { computed } from "vue"
import type { UptimeBar } from "@/api/types"
import { useAppStore } from "@/stores/app"

const props = defineProps<{
  bars: UptimeBar[]
  days: number
}>()

const store = useAppStore()

interface Cell {
  date: string
  ratio: number
  avg_ms: number | null
  key: number
}

const cells = computed<Cell[]>(() => {
  const byDate = new Map(props.bars.map((b) => [b.date, b]))
  const out: Cell[] = []
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  for (let i = props.days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    const bar = byDate.get(key)
    out.push({
      date: key,
      ratio: bar ? bar.ok_ratio : -1,
      avg_ms: bar?.avg_ms ?? null,
      key: d.getTime(),
    })
  }
  return out
})

function color(cell: Cell): string {
  if (cell.ratio < 0) return "var(--line)"
  if (cell.ratio >= 0.999) return "var(--ok)"
  if (cell.ratio >= 0.9) return "var(--warn)"
  return "var(--down)"
}

function title(cell: Cell): string {
  if (cell.ratio < 0) return `${cell.date} — ${store.t("monitor.no-data")}`
  const pct = (cell.ratio * 100).toFixed(cell.ratio === 1 ? 0 : 2)
  const ms = cell.avg_ms != null ? ` · ${Math.round(cell.avg_ms)} ms` : ""
  return `${cell.date} — ${pct}%${ms}`
}
</script>

<template>
  <div class="uptime-bars" role="img" aria-label="uptime history">
    <div
      v-for="cell in cells"
      :key="cell.key"
      class="bar"
      :style="{ background: color(cell) }"
      :title="title(cell)"
    />
  </div>
</template>

<style scoped>
.uptime-bars {
  display: flex;
  gap: 2px;
  height: 26px;
}

.bar {
  flex: 1 1 0;
  min-width: 2px;
  border-radius: 1px;
  transition: transform 0.12s ease;
}

.bar:hover {
  transform: scaleY(1.35);
}
</style>
