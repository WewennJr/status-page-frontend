<script setup lang="ts">
import { computed } from "vue"
import type { HistoryPoint } from "@/api/types"

const props = defineProps<{
  points: HistoryPoint[]
  height?: number
}>()

const W = 720
const H = computed(() => props.height ?? 140)
const PAD = 6

const path = computed(() => {
  const pts = props.points.filter((p) => p.avg_ms != null)
  if (pts.length < 2) return null
  const max = Math.max(...pts.map((p) => p.avg_ms ?? 0), 1)
  const stepX = (W - 2 * PAD) / (pts.length - 1)
  const toXY = (p: HistoryPoint, i: number): [number, number] => [
    PAD + i * stepX,
    PAD + (1 - (p.avg_ms ?? 0) / max) * (H.value - 2 * PAD),
  ]
  let d = ""
  pts.forEach((p, i) => {
    const [x, y] = toXY(p, i)
    d += (i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`)
  })
  return d
})

const area = computed(() => {
  const d = path.value
  if (!d) return null
  const h = H.value
  return `${d} L ${(W - PAD).toFixed(1)} ${(h - PAD).toFixed(1)} L ${PAD} ${(h - PAD).toFixed(1)} Z`
})

const maxLabel = computed(() => {
  const pts = props.points.filter((p) => p.avg_ms != null)
  if (!pts.length) return ""
  const max = Math.max(...pts.map((p) => p.avg_ms ?? 0))
  return `${Math.round(max)} ms`
})
</script>

<template>
  <div class="chart-wrap">
    <svg
      v-if="path"
      :viewBox="`0 0 ${W} ${H}`"
      preserveAspectRatio="none"
      class="chart"
    >
      <defs>
        <linearGradient id="rt-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.35" />
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path v-if="area" :d="area" fill="url(#rt-fill)" />
      <path :d="path" fill="none" stroke="var(--accent)" stroke-width="1.6" />
    </svg>
    <div v-else class="no-data muted">—</div>
    <span class="max-label mono muted">{{ maxLabel }}</span>
  </div>
</template>

<style scoped>
.chart-wrap {
  position: relative;
  height: 140px;
  border: 1px solid var(--line);
  border-radius: 3px;
  background: var(--panel-soft);
  overflow: hidden;
}

.chart {
  width: 100%;
  height: 100%;
  display: block;
}

.no-data {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.15em;
}

.max-label {
  position: absolute;
  top: 0.4rem;
  right: 0.6rem;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
}
</style>
