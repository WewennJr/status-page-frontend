<script setup lang="ts">
import { reactive, watch } from "vue"
import type { MonitorAdmin, MonitorInput } from "@/api/types"
import { useAppStore } from "@/stores/app"

const props = withDefaults(
  defineProps<{
    monitor?: MonitorAdmin | null
    saving?: boolean
    error?: string
    compact?: boolean
  }>(),
  { monitor: null, saving: false, error: "", compact: false },
)

const emit = defineEmits<{
  (e: "submit", value: MonitorInput): void
  (e: "cancel"): void
}>()

const store = useAppStore()

function fromMonitor(m: MonitorAdmin | null): MonitorInput {
  return {
    name: m?.name ?? "",
    url: m?.url ?? "https://",
    description: m?.description ?? "",
    group_name: m?.group_name ?? "Services",
    interval_seconds: m?.interval_seconds ?? 60,
    email: m?.email ?? "",
    show_response_time: m?.show_response_time ?? true,
    show_uptime: m?.show_uptime ?? true,
    position: m?.position ?? 0,
    active: m?.active ?? true,
  }
}

const form = reactive<MonitorInput>(fromMonitor(props.monitor))

watch(
  () => props.monitor,
  (m) => Object.assign(form, fromMonitor(m)),
)

function submit() {
  emit("submit", { ...form })
}
</script>

<template>
  <form
    class="card lisered monitor-form"
    :class="{ compact: props.compact }"
    @submit.prevent="submit"
  >
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

    <p v-if="props.error" class="form-error">{{ props.error }}</p>

    <div class="form-actions">
      <button type="button" class="btn ghost" @click="emit('cancel')">
        {{ store.t("common.cancel") }}
      </button>
      <button type="submit" class="btn" :disabled="props.saving">
        {{ store.t("admin.monitors.save") }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.monitor-form {
  margin-bottom: 1.4rem;
}

.monitor-form.compact {
  margin-bottom: 0;
  padding: 1.2rem 1.3rem;
  background: var(--panel-soft);
  box-shadow: none;
}
</style>
