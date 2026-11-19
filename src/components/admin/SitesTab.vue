<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { del, get, post, put } from "@/api/client"
import type { MonitorAdmin, MonitorInput } from "@/api/types"
import MonitorForm from "@/components/admin/MonitorForm.vue"
import { useAppStore } from "@/stores/app"

const store = useAppStore()
const monitors = ref<MonitorAdmin[]>([])
const creating = ref(false)
const createGroup = ref<string | null>(null)
const editingId = ref<number | null>(null)
const saving = ref(false)
const formError = ref("")

const dragId = ref<number | null>(null)
const dropTarget = ref<{ id: number; after: boolean } | { group: string } | null>(null)

const sorted = computed(() =>
  [...monitors.value].sort((a, b) => a.position - b.position || a.id - b.id),
)

const groups = computed(() => {
  const map = new Map<string, MonitorAdmin[]>()
  for (const m of sorted.value) {
    const key = m.group_name || store.t("group.services")
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }
  return [...map.entries()].map(([name, list]) => ({ name, monitors: list }))
})

async function load() {
  try {
    monitors.value = await get<MonitorAdmin[]>("/api/admin/monitors")
  } catch {
    monitors.value = []
  }
}

function startCreate(group?: string) {
  editingId.value = null
  createGroup.value = group ?? null
  creating.value = true
  formError.value = ""
}

function startEdit(m: MonitorAdmin) {
  creating.value = false
  editingId.value = m.id
  formError.value = ""
}

function closeForms() {
  creating.value = false
  createGroup.value = null
  editingId.value = null
  formError.value = ""
}

/* ===== Drag & drop reordering ===== */

function startDrag(m: MonitorAdmin, event: DragEvent) {
  if (editingId.value === m.id) {
    event.preventDefault()
    return
  }
  dragId.value = m.id
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", String(m.id))
  }
}

function endDrag() {
  dragId.value = null
  dropTarget.value = null
}

function overRow(m: MonitorAdmin, event: DragEvent) {
  if (dragId.value == null || dragId.value === m.id) return
  event.preventDefault()
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  dropTarget.value = { id: m.id, after: event.clientY > rect.top + rect.height / 2 }
}

function overGroup(name: string, event: DragEvent) {
  if (dragId.value == null) return
  if ((event.target as HTMLElement).closest(".monitor-row")) return
  event.preventDefault()
  dropTarget.value = { group: name }
}

function rowClass(m: MonitorAdmin) {
  const target = dropTarget.value
  const classes: Record<string, boolean> = { dragging: dragId.value === m.id }
  if (target && "id" in target && target.id === m.id) {
    classes[target.after ? "drop-after" : "drop-before"] = true
  }
  return classes
}

async function dropOn() {
  const sourceId = dragId.value
  const target = dropTarget.value
  endDrag()
  if (sourceId == null || !target) return

  const ordered = sorted.value
  const source = ordered.find((m) => m.id === sourceId)
  if (!source) return
  const without = ordered.filter((m) => m.id !== sourceId)

  let targetGroup: string
  let insertIndex: number
  if ("group" in target) {
    targetGroup = target.group
    const last = without.reduce((acc, m, i) => (m.group_name === targetGroup ? i : acc), -1)
    insertIndex = last >= 0 ? last + 1 : without.length
  } else {
    const targetMonitor = monitors.value.find((m) => m.id === target.id)
    if (!targetMonitor) return
    targetGroup = targetMonitor.group_name
    const index = without.findIndex((m) => m.id === target.id)
    insertIndex = index + (target.after ? 1 : 0)
  }

  const moved: MonitorAdmin = { ...source, group_name: targetGroup }
  const next = [...without.slice(0, insertIndex), moved, ...without.slice(insertIndex)]
  const reindexed = next.map((m, i) => ({ ...m, position: i }))
  monitors.value = reindexed
  await persist(reindexed)
}

async function persist(list: MonitorAdmin[]) {
  try {
    await post("/api/admin/monitors/reorder", {
      items: list.map((m) => ({
        id: m.id,
        group_name: m.group_name,
        position: m.position,
      })),
    })
  } catch {
    formError.value = store.t("common.error")
    await load()
  }
}

/** Place a site at the end of its group after creation/move. */
async function placeAtEnd(id: number) {
  const ordered = sorted.value
  const item = ordered.find((m) => m.id === id)
  if (!item) return
  const without = ordered.filter((m) => m.id !== id)
  const last = without.reduce((acc, m, i) => (m.group_name === item.group_name ? i : acc), -1)
  const index = last >= 0 ? last + 1 : without.length
  const next = [...without.slice(0, index), item, ...without.slice(index)]
  const reindexed = next.map((m, i) => ({ ...m, position: i }))
  monitors.value = reindexed
  await persist(reindexed)
}

/* ===== CRUD ===== */

async function save(payload: MonitorInput) {
  saving.value = true
  formError.value = ""
  const editId = editingId.value
  const previous = monitors.value.find((m) => m.id === editId)
  try {
    if (editId != null) {
      await put(`/api/admin/monitors/${editId}`, payload)
      closeForms()
      await load()
      if (previous && previous.group_name !== payload.group_name) await placeAtEnd(editId)
    } else {
      const created = await post<MonitorAdmin>("/api/admin/monitors", payload)
      closeForms()
      await load()
      await placeAtEnd(created.id)
    }
  } catch {
    formError.value = store.t("common.error")
  } finally {
    saving.value = false
  }
}

async function remove(m: MonitorAdmin) {
  if (!window.confirm(store.t("admin.monitors.confirm-delete"))) return
  try {
    await del(`/api/admin/monitors/${m.id}`)
    if (editingId.value === m.id) closeForms()
    await load()
  } catch {
    formError.value = store.t("common.error")
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="toolbar">
      <button class="btn" @click="creating ? closeForms() : startCreate()">
        {{ creating ? store.t("common.cancel") : store.t("admin.monitors.add") }}
      </button>
    </div>

    <p v-if="!monitors.length && !creating" class="muted empty">
      {{ store.t("admin.monitors.empty") }}
    </p>

    <MonitorForm
      v-if="creating"
      :saving="saving"
      :error="formError"
      :initial-group="createGroup ?? undefined"
      @submit="save"
      @cancel="closeForms"
    />

    <section
      v-for="g in groups"
      :key="g.name"
      class="site-group"
      @dragover="overGroup(g.name, $event)"
      @drop.prevent="dropOn"
    >
      <header
        class="group-head"
        :class="{ 'drop-group': dropTarget && 'group' in dropTarget && dropTarget.group === g.name }"
      >
        <h3 class="group-title mono">
          {{ g.name }}
          <span class="group-count">{{ g.monitors.length }}</span>
        </h3>
        <button
          class="icon-btn small add-group-btn"
          :title="store.t('admin.monitors.add-to-group')"
          :aria-label="store.t('admin.monitors.add-to-group')"
          @click="startCreate(g.name)"
        >
          +
        </button>
      </header>

      <article
        v-for="m in g.monitors"
        :key="m.id"
        class="card monitor-row"
        :class="rowClass(m)"
        :draggable="editingId !== m.id"
        @dragstart="startDrag(m, $event)"
        @dragend="endDrag"
        @dragover.stop="overRow(m, $event)"
        @drop.stop.prevent="dropOn"
      >
        <div class="row-main">
          <span class="drag-handle" :title="store.t('admin.monitors.reorder')" aria-hidden="true">⠿</span>
          <div>
            <h3 class="row-title">
              {{ m.name }}
              <span v-if="!m.active" class="grade-badge subtle">
                {{ store.t("admin.monitors.active") }} : {{ store.t("common.no") }}
              </span>
            </h3>
            <p class="mono muted row-url">{{ m.url }}</p>
            <p v-if="m.description" class="muted row-desc">{{ m.description }}</p>
          </div>
          <div class="row-meta mono muted">
            <span>{{ m.group_name }}</span>
            <span>{{ m.interval_seconds }}s</span>
          </div>
          <div class="row-actions">
            <button
              class="btn small ghost"
              :class="{ active: editingId === m.id }"
              @click="editingId === m.id ? closeForms() : startEdit(m)"
            >
              {{ editingId === m.id ? store.t("common.cancel") : store.t("admin.monitors.edit") }}
            </button>
            <button class="btn small danger" @click="remove(m)">
              {{ store.t("admin.monitors.delete") }}
            </button>
          </div>
        </div>

        <MonitorForm
          v-if="editingId === m.id"
          class="inline-form"
          :monitor="m"
          :saving="saving"
          :error="formError"
          compact
          @submit="save"
          @cancel="closeForms"
        />
      </article>
    </section>
  </div>
</template>

<style scoped>
.site-group {
  margin-bottom: 1.4rem;
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-bottom: 1px solid var(--line);
  padding: 0.2rem 0.2rem 0.45rem;
  margin-bottom: 0.7rem;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.group-head.drop-group {
  border-bottom-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0;
  font-size: 0.66rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted);
}

.group-count {
  border: 1px solid var(--line);
  border-radius: 2px;
  padding: 0 0.4rem;
  font-size: 0.6rem;
  letter-spacing: 0.06em;
}

.add-group-btn {
  width: 26px;
  height: 26px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  line-height: 1;
}

.monitor-row {
  margin-bottom: 0.8rem;
  padding: 1.1rem 1.3rem;
  transition: opacity 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.monitor-row:hover {
  border-color: var(--line-strong);
}

.monitor-row[draggable="true"] {
  cursor: grab;
}

.monitor-row.dragging {
  opacity: 0.4;
}

.monitor-row.drop-before {
  box-shadow: inset 0 2px 0 var(--accent), 0 18px 44px var(--shadow);
}

.monitor-row.drop-after {
  box-shadow: inset 0 -2px 0 var(--accent), 0 18px 44px var(--shadow);
}

.row-main {
  display: flex;
  gap: 1.2rem;
  align-items: flex-start;
}

.drag-handle {
  color: var(--muted);
  font-size: 1.05rem;
  line-height: 1.2;
  user-select: none;
  flex-shrink: 0;
  padding-top: 0.1rem;
}

.row-main > div {
  flex: 1;
  min-width: 0;
}

.row-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.row-url {
  margin: 0.2rem 0 0;
  font-size: 0.72rem;
  word-break: break-all;
}

.row-desc {
  margin: 0.25rem 0 0;
  font-size: 0.84rem;
}

.row-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding-top: 0.2rem;
  flex: 0 0 auto;
}

.row-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}

.inline-form {
  margin-top: 1rem;
}

@media (max-width: 640px) {
  .row-main {
    flex-wrap: wrap;
  }
  .row-actions {
    flex-wrap: wrap;
  }
}
</style>
