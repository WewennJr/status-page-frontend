<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import { get, put } from "@/api/client"
import { useAppStore } from "@/stores/app"

const store = useAppStore()
const saving = ref(false)
const saved = ref(false)
const formError = ref("")

const form = reactive({
  site_name: "Status Page",
  site_icon: "",
  accent_color: "#ffb454",
  welcome_text: "",
  footer_text: "",
  default_language: "fr",
  default_theme: "system",
  retention_days: 90,
  history_days: 90,
})

async function load() {
  try {
    const settings = await get<Record<string, string>>("/api/admin/settings")
    form.site_name = settings.site_name ?? form.site_name
    form.site_icon = settings.site_icon ?? ""
    form.accent_color = settings.accent_color ?? form.accent_color
    form.welcome_text = settings.welcome_text ?? ""
    form.footer_text = settings.footer_text ?? ""
    form.default_language = settings.default_language ?? "fr"
    form.default_theme = settings.default_theme ?? "system"
    form.retention_days = parseInt(settings.retention_days ?? "90", 10) || 90
    form.history_days = parseInt(settings.history_days ?? "90", 10) || 90
  } catch {
    formError.value = store.t("common.error")
  }
}

async function save() {
  saving.value = true
  formError.value = ""
  saved.value = false
  try {
    await put("/api/admin/settings", { ...form })
    saved.value = true
    store.ingestSettings({
      ...store.settings,
      site_name: form.site_name,
      accent_color: form.accent_color,
      default_language: form.default_language,
    })
    setTimeout(() => (saved.value = false), 2500)
  } catch {
    formError.value = store.t("common.error")
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <form class="card lisered settings-form" @submit.prevent="save">
    <div class="form-row">
      <div class="form-field">
        <label>{{ store.t("admin.settings.site-name") }}</label>
        <input v-model="form.site_name" type="text" maxlength="128" required />
      </div>
      <div class="form-field">
        <label>{{ store.t("admin.settings.site-icon") }}</label>
        <input v-model="form.site_icon" type="text" maxlength="255" placeholder="🟠 ou https://…" />
      </div>
    </div>

    <div class="form-field">
      <label>{{ store.t("admin.settings.accent") }}</label>
      <div class="color-row">
        <input v-model="form.accent_color" type="color" class="color-input" />
        <input v-model="form.accent_color" type="text" class="mono" maxlength="9" />
      </div>
    </div>

    <div class="form-field">
      <label>{{ store.t("admin.settings.welcome") }}</label>
      <textarea v-model="form.welcome_text" rows="2" />
    </div>

    <div class="form-field">
      <label>{{ store.t("admin.settings.footer") }}</label>
      <input v-model="form.footer_text" type="text" maxlength="255" />
    </div>

    <div class="form-row three">
      <div class="form-field">
        <label>{{ store.t("admin.settings.lang") }}</label>
        <select v-model="form.default_language">
          <option value="fr">FR</option>
          <option value="en">EN</option>
        </select>
      </div>
      <div class="form-field">
        <label>{{ store.t("admin.settings.theme") }}</label>
        <select v-model="form.default_theme">
          <option value="system">{{ store.t("theme.system") }}</option>
          <option value="light">{{ store.t("theme.light") }}</option>
          <option value="dark">{{ store.t("theme.dark") }}</option>
        </select>
      </div>
      <div class="form-field">
        <label>{{ store.t("admin.settings.history") }}</label>
        <input v-model.number="form.history_days" type="number" min="7" max="365" />
      </div>
    </div>

    <div class="form-row">
      <div class="form-field">
        <label>{{ store.t("admin.settings.retention") }}</label>
        <input v-model.number="form.retention_days" type="number" min="7" max="3650" />
      </div>
    </div>

    <p v-if="formError" class="form-error">{{ formError }}</p>
    <p v-if="saved" class="form-success">{{ store.t("common.saved") }}</p>

    <div class="form-actions">
      <button type="submit" class="btn" :disabled="saving">{{ store.t("common.save") }}</button>
    </div>
  </form>
</template>

<style scoped>
.settings-form {
  max-width: 720px;
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
  margin-bottom: 1rem;
}

.form-field label {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}

.form-field input,
.form-field select,
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
.form-field select:focus,
.form-field textarea:focus {
  border-color: var(--accent);
}

.form-field select option {
  background: var(--panel);
  color: var(--text);
}

.form-field textarea {
  resize: vertical;
  min-height: 3rem;
}

.color-row {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}

.color-input {
  width: 46px;
  height: 34px;
  padding: 2px;
  border: 1px solid var(--line);
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .form-row,
  .form-row.three {
    grid-template-columns: 1fr;
  }
}
</style>
