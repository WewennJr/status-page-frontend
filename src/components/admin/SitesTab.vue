<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import { del, get, post, put } from "@/api/client"
import type { MonitorAdmin } from "@/api/types"
import { useAppStore } from "@/stores/app"

const store = useAppStore()
const monitors = ref<MonitorAdmin[]>([])
const editingId = ref<number | null>(null)
const showForm = ref(false)
const saving = ref(false)
const formError = ref("")

const blank = {
  name: "",
  url: "https://",
  description: "",
  group_name: "Services",
  interval_seconds: 60,
  email: "",
  show_response_time: true,
  show_uptime: true,
  position: 0,
  active: true,
}

const form = reactive<typeof blank>({ ...blank })

async function load() {
  try {
    monitors.value = await get<MonitorAdmin[]>("/api/admin/monitors")
  } catch {
    monitors.value = []
  }
}

function startCreate() {
  Object.assign(form, blank)
  editingId.value = null
  showForm.value = true
  formError.value = ""
}

function startEdit(m: MonitorAdmin) {
  Object.assign(form, {
    name: m.name,
    url: m.url,
    description: m.description,
    group_name: m.group_name,
    interval_seconds: m.interval_seconds,
    email: m.email,
    show_response_time: m.show_response_time,
    show_uptime: m.show_uptime,
    position: m.position,
    active: m.active,
  })
  editingId.value = m.id
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
    const body = { ...form }
    if (editingId.value != null) {
      await put(`/api/admin/monitors/${editingId.value}`, body)
    } else {
      await post("/api/admin/monitors", body)
    }
    closeForm()
    await load()
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
    if (editingId.value === m.id) closeForm()
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
      <button class="btn" @click="showForm ? closeForm() : startCreate()">
        {{ showForm ? store.t("common.cancel") : store.t("admin.monitors.add") }}
      </button>
    </div>

    <p v-if="!monitors.length && !showForm" class="muted empty">
      {{ store.t("admin.monitors.empty") }}
    </p>

    <form v-if="showForm" class="card lisered monitor-form" @submit.prevent="save">
      <div class="form-row">
        <div class="form-field">
          <label>{{ store.t("admin.monitors.name") }}</label>
          <input v-model="form.name" type="text" required maxlength="128" />
        </div>
        <div class="form-field">
          <label>{{ store.t("admin.monitors.group") }}</label>
          <input v-model="form.group_name" type="text" maxlength="64" />
        </div>
      </div>

      <div class="form-field">
        <label>{{ store.t("admin.monitors.url") }}</label>
        <input v-model="form.url" type="url" required />
      </div>

      <div class="form-field">
        <label>{{ store.t("admin.monitors.description") }}</label>
        <textarea v-model="form.description" rows="2" />
      </div>

      <div class="form-row three">
        <div class="form-field">
          <label>{{ store.t("admin.monitors.interval") }}</label>
          <input v-model.number="form.interval_seconds" type="number" min="10" max="86400" />
        </div>
        <div class="form-field">
          <label>{{ store.t("admin.monitors.position") }}</label>
          <input v-model.number="form.position" type="number" />
        </div>
        <div class="form-field">
          <label>{{ store.t("admin.monitors.email") }}</label>
          <input v-model="form.email" type="email" />
        </div>
      </div>

      <div class="toggles">
        <label class="toggle">
          <input v-model="form.show_response_time" type="checkbox" />
          {{ store.t("admin.monitors.show-rt") }}
        </label>
        <label class="toggle">
          <input v-model="form.show_uptime" type="checkbox" />
          {{ store.t("admin.monitors.show-uptime") }}
        </label>
        <label class="toggle">
          <input v-model="form.active" type="checkbox" />
          {{ store.t("admin.monitors.active") }}
        </label>
      </div>

      <p v-if="formError" class="form-error">{{ formError }}</p>

      <div class="form-actions">
        <button type="button" class="btn ghost" @click="closeForm()">
          {{ store.t("common.cancel") }}
        </button>
        <button type="submit" class="btn" :disabled="saving">
          {{ store.t("admin.monitors.save") }}
        </button>
      </div>
    </form>

    <article v-for="m in monitors" :key="m.id" class="card monitor-row">
      <div class="row-main">
        <div>
          <h3 class="row-title">
            {{ m.name }}
            <span
              v-if="!m.active"
              class="grade-badge subtle"
            >{{ store.t("admin.monitors.active") }} : {{ store.t("common.no") }}</span>
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
            @click="editingId === m.id ? closeForm() : startEdit(m)"
          >
            {{ editingId === m.id ? store.t("common.cancel") : store.t("admin.monitors.edit") }}
          </button>
          <button class="btn small danger" @click="remove(m)">
            {{ store.t("admin.monitors.delete") }}
          </button>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.toolbar {
  margin-bottom: 1rem;
}

.empty {
  font-size: 0.9rem;
  padding: 1rem 0;
}

.monitor-form {
  margin-bottom: 1.4rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-row.three {
  grid-template-columns: 1fr 1fr 1fr;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.9rem;
}

.form-field label,
.field-label {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}

.form-field input,
.form-field textarea {
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 3px;
  color: var(--text);
  padding: 0.5rem 0.7rem;
  font: inherit;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.form-field input:focus,
.form-field textarea:focus {
  border-color: var(--accent);
}

.form-field textarea {
  resize: vertical;
  min-height: 3rem;
}

.toggles {
  display: flex;
  gap: 1.4rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
  color: var(--muted);
  cursor: pointer;
}

.toggle input {
  accent-color: var(--accent);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.monitor-row {
  margin-bottom: 0.8rem;
  padding: 1.1rem 1.3rem;
}

.row-main {
  display: flex;
  gap: 1.2rem;
  align-items: flex-start;
}

.row-main > div:first-child {
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
  flex-shrink: 0;
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

.grade-badge {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  border: 1px solid var(--line-strong);
  color: var(--muted);
  padding: 0.18rem 0.5rem;
  border-radius: 2px;
}

.grade-badge.subtle {
  border-color: var(--line);
  color: var(--muted);
}

@media (max-width: 640px) {
  .row-main {
    flex-direction: column;
  }
  .form-row,
  .form-row.three {
    grid-template-columns: 1fr;
  }
}
</style>
