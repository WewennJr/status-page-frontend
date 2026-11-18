<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { del, get, post, put } from "@/api/client"
import type { IncidentAdmin, MonitorAdmin } from "@/api/types"
import { useAppStore } from "@/stores/app"

const store = useAppStore()

const STATUSES = ["investigating", "identified", "monitoring", "resolved"] as const

const incidents = ref<IncidentAdmin[]>([])
const monitors = ref<MonitorAdmin[]>([])
const showForm = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const formError = ref("")
const expanded = ref<Set<number>>(new Set())

const form = ref({
  title: "",
  description: "",
  monitor_id: null as number | null,
  status: "investigating" as (typeof STATUSES)[number],
})

const updateForm = ref({
  incident_id: null as number | null,
  message: "",
  status: "" as string,
})

const sortedIncidents = computed(() =>
  [...incidents.value].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)),
)

const monitorOptions = computed(() => [
  { value: null, label: store.t("incident.all-services") },
  ...monitors.value.map((m) => ({ value: m.id, label: m.name })),
])

async function load() {
  try {
    incidents.value = await get<IncidentAdmin[]>("/api/admin/incidents?limit=100")
    monitors.value = await get<MonitorAdmin[]>("/api/admin/monitors")
  } catch {
    incidents.value = []
  }
}

function startCreate() {
  editingId.value = null
  form.value = {
    title: "",
    description: "",
    monitor_id: monitors.value[0]?.id ?? null,
    status: "investigating",
  }
  showForm.value = true
  formError.value = ""
}

function startEdit(i: IncidentAdmin) {
  editingId.value = i.id
  form.value = {
    title: i.title,
    description: i.description,
    monitor_id: i.monitor_id,
    status: i.status as (typeof STATUSES)[number],
  }
  showForm.value = true
  formError.value = ""
}

function closeForm() {
  showForm.value = false
  editingId.value = null
}

async function save() {
  saving.value = true
  formError.value = ""
  try {
    if (editingId.value != null) {
      await put(`/api/admin/incidents/${editingId.value}`, form.value)
    } else {
      await post("/api/admin/incidents", form.value)
    }
    closeForm()
    await load()
  } catch {
    formError.value = store.t("common.error")
  } finally {
    saving.value = false
  }
}

async function postUpdate() {
  const { incident_id, message, status } = updateForm.value
  if (incident_id == null || !message.trim()) return
  saving.value = true
  formError.value = ""
  try {
    await post(`/api/admin/incidents/${incident_id}/updates`, {
      message: message.trim(),
      status: status || "",
    })
    updateForm.value = { incident_id: null, message: "", status: "" }
    await load()
  } catch {
    formError.value = store.t("common.error")
  } finally {
    saving.value = false
  }
}

async function remove(i: IncidentAdmin) {
  if (!window.confirm(store.t("admin.monitors.confirm-delete"))) return
  try {
    await del(`/api/admin/incidents/${i.id}`)
    await load()
  } catch {
    formError.value = store.t("common.error")
  }
}

function toggleExpand(id: number) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(store.lang === "fr" ? "fr-FR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

onMounted(load)
</script>

<template>
  <div>
    <div class="toolbar">
      <button class="btn" @click="showForm ? closeForm() : startCreate()">
        {{ showForm && editingId == null ? store.t("common.cancel") : store.t("admin.incidents.new") }}
      </button>
    </div>

    <form v-if="showForm" class="card lisered incident-form" @submit.prevent="save">
      <div class="form-field">
        <label>{{ store.t("admin.incidents.title") }}</label>
        <input v-model="form.title" type="text" required maxlength="200" />
      </div>
      <div class="form-field">
        <label>{{ store.t("admin.incidents.description") }}</label>
        <textarea v-model="form.description" rows="3" />
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>{{ store.t("admin.incidents.monitor") }}</label>
          <select v-model="form.monitor_id">
            <option v-for="opt in monitorOptions" :key="String(opt.value)" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="form-field">
          <label>Status</label>
          <select v-model="form.status">
            <option v-for="s in STATUSES" :key="s" :value="s">
              {{ store.t("incidents.status." + s) }}
            </option>
          </select>
        </div>
      </div>

      <p v-if="formError" class="form-error">{{ formError }}</p>

      <div class="form-actions">
        <button type="button" class="btn ghost" @click="closeForm()">
          {{ store.t("common.cancel") }}
        </button>
        <button type="submit" class="btn" :disabled="saving">{{ store.t("common.save") }}</button>
      </div>
    </form>

    <p v-if="!incidents.length" class="muted empty">{{ store.t("admin.incidents.none") }}</p>

    <article v-for="i in sortedIncidents" :key="i.id" class="card incident-row">
      <div class="row-head">
        <div class="row-info">
          <h3>{{ i.title }}</h3>
          <p class="mono muted row-meta">
            <span class="grade-badge">{{ store.t("incidents.status." + i.status) }}</span>
            {{ i.monitor_id ? monitors.find((m) => m.id === i.monitor_id)?.name ?? "?" : store.t("incident.all-services") }}
            · {{ fmtTime(i.updated_at) }}
            <span v-if="i.auto" class="auto-tag">auto</span>
          </p>
        </div>
        <div class="row-actions">
          <button class="btn small ghost" @click="toggleExpand(i.id)">
            {{ store.t("admin.incidents.add-update") }}
          </button>
          <button class="btn small ghost" @click="startEdit(i)">
            {{ store.t("admin.monitors.edit") }}
          </button>
          <button class="btn small danger" @click="remove(i)">
            {{ store.t("admin.monitors.delete") }}
          </button>
        </div>
      </div>

      <form v-if="expanded.has(i.id)" class="update-form" @submit.prevent="postUpdate">
        <div class="form-field">
          <label>{{ store.t("admin.incidents.update-msg") }}</label>
          <textarea v-model="updateForm.message" rows="2" required />
        </div>
        <div class="form-field narrow">
          <label>Status</label>
          <select v-model="updateForm.status">
            <option value="">—</option>
            <option v-for="s in STATUSES" :key="s" :value="s">
              {{ store.t("incidents.status." + s) }}
            </option>
          </select>
        </div>
        <button
          type="button"
          class="btn small"
          :disabled="saving"
          @click="updateForm.incident_id = i.id; postUpdate()"
        >
          {{ store.t("admin.incidents.add-update") }}
        </button>
      </form>
    </article>
  </div>
</template>

<style scoped>
.incident-form {
  margin-bottom: 1.4rem;
}

.incident-form .form-row {
  grid-template-columns: 2fr 1fr;
}

.form-field.narrow {
  max-width: 220px;
}

.incident-row {
  margin-bottom: 0.8rem;
  padding: 1.1rem 1.3rem;
}

.row-head {
  display: flex;
  gap: 1.2rem;
  align-items: flex-start;
  justify-content: space-between;
}

.row-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.row-meta {
  margin: 0.3rem 0 0;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.auto-tag {
  border: 1px solid var(--line);
  border-radius: 2px;
  padding: 0 0.4rem;
  color: var(--muted);
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.row-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.update-form {
  margin-top: 1rem;
  border-top: 1px solid var(--line);
  padding-top: 1rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.update-form .form-field {
  flex: 1;
  margin-bottom: 0;
}

.update-form .form-field.narrow {
  flex: 0 0 200px;
}

@media (max-width: 640px) {
  .row-head {
    flex-direction: column;
  }
  .incident-form .form-row {
    grid-template-columns: 1fr;
  }
  .update-form {
    flex-direction: column;
  }
}
</style>
