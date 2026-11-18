<script setup lang="ts">
import { onMounted, ref } from "vue"
import { del, get, post, put } from "@/api/client"
import type { MonitorAdmin, MonitorInput } from "@/api/types"
import MonitorForm from "@/components/admin/MonitorForm.vue"
import { useAppStore } from "@/stores/app"

const store = useAppStore()
const monitors = ref<MonitorAdmin[]>([])
const creating = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const formError = ref("")

async function load() {
  try {
    monitors.value = await get<MonitorAdmin[]>("/api/admin/monitors")
  } catch {
    monitors.value = []
  }
}

function startCreate() {
  editingId.value = null
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
  editingId.value = null
  formError.value = ""
}

async function save(payload: MonitorInput) {
  saving.value = true
  formError.value = ""
  try {
    if (editingId.value != null) {
      await put(`/api/admin/monitors/${editingId.value}`, payload)
    } else {
      await post("/api/admin/monitors", payload)
    }
    closeForms()
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
      @submit="save"
      @cancel="closeForms"
    />

    <article v-for="m in monitors" :key="m.id" class="card monitor-row">
      <div class="row-main">
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
  </div>
</template>

<style scoped>
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

.inline-form {
  margin-top: 1rem;
}

@media (max-width: 640px) {
  .row-main {
    flex-direction: column;
  }
  .row-actions {
    flex-wrap: wrap;
  }
}
</style>
