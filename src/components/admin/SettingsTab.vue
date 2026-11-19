<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import { get, put } from "@/api/client"
import type { AdminAccount } from "@/api/types"
import Modal from "@/components/Modal.vue"
import { useAppStore } from "@/stores/app"

const store = useAppStore()
const emit = defineEmits<{ (e: "account-updated", username: string): void }>()

const saving = ref(false)
const saved = ref(false)
const formError = ref("")

const form = reactive({
  site_name: "Status Page",
  site_icon: "",
  site_url: "",
  favicon_url: "",
  accent_color: "",
  ok_color: "",
  down_color: "",
  welcome_text: "",
  footer_text: "",
  default_language: "fr",
  default_theme: "system",
  retention_days: 90,
  history_days: 90,
  default_show_uptime: true,
  default_show_response_time: true,
  show_incidents_history: true,
})

const asBool = (value: string | undefined, fallback: boolean) =>
  value == null ? fallback : value === "true"

const THEME_COLORS = { accent_color: "#ffb454", ok_color: "#7fd8a4", down_color: "#ff6a66" }

function onColor(key: "accent_color" | "ok_color" | "down_color", event: Event) {
  form[key] = (event.target as HTMLInputElement).value
}

async function load() {
  try {
    const settings = await get<Record<string, string>>("/api/admin/settings")
    form.site_name = settings.site_name ?? form.site_name
    form.site_icon = settings.site_icon ?? ""
    form.site_url = settings.site_url ?? ""
    form.favicon_url = settings.favicon_url ?? ""
    form.accent_color = settings.accent_color ?? ""
    form.ok_color = settings.ok_color ?? ""
    form.down_color = settings.down_color ?? ""
    form.welcome_text = settings.welcome_text ?? ""
    form.footer_text = settings.footer_text ?? ""
    form.default_language = settings.default_language ?? "fr"
    form.default_theme = settings.default_theme ?? "system"
    form.retention_days = parseInt(settings.retention_days ?? "90", 10) || 90
    form.history_days = parseInt(settings.history_days ?? "90", 10) || 90
    form.default_show_uptime = asBool(settings.default_show_uptime, true)
    form.default_show_response_time = asBool(settings.default_show_response_time, true)
    form.show_incidents_history = asBool(settings.show_incidents_history, true)
  } catch {
    formError.value = store.t("common.error")
  }
}

async function save() {
  saving.value = true
  formError.value = ""
  saved.value = false
  try {
    const updated = await put<Record<string, string>>("/api/admin/settings", { ...form })
    store.ingestSettings({ ...store.settings, ...updated })
    saved.value = true
    setTimeout(() => (saved.value = false), 2500)
  } catch {
    formError.value = store.t("common.error")
  } finally {
    saving.value = false
  }
}

/* ===== Admin account ===== */
const accountOpen = ref(false)
const accountLoading = ref(false)
const accountSaving = ref(false)
const accountError = ref("")
const accountSaved = ref(false)
const account = reactive({
  username: "",
  current_password: "",
  new_password: "",
})

async function openAccount() {
  accountOpen.value = true
  accountError.value = ""
  accountSaved.value = false
  account.current_password = ""
  account.new_password = ""
  accountLoading.value = true
  try {
    const info = await get<AdminAccount>("/api/admin/account")
    account.username = info.username
  } catch {
    accountError.value = store.t("common.error")
  } finally {
    accountLoading.value = false
  }
}

function closeAccount() {
  accountOpen.value = false
}

async function saveAccount() {
  accountSaving.value = true
  accountError.value = ""
  accountSaved.value = false
  try {
    await put<AdminAccount>("/api/admin/account", {
      username: account.username,
      current_password: account.current_password,
      new_password: account.new_password || null,
    })
    accountSaved.value = true
    account.current_password = ""
    account.new_password = ""
    emit("account-updated", account.username)
    setTimeout(() => (accountSaved.value = false), 3000)
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (message.includes("409")) accountError.value = store.t("admin.account.taken")
    else if (message.includes("403")) accountError.value = store.t("admin.account.error")
    else accountError.value = store.t("common.error")
  } finally {
    accountSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="settings-layout">
    <form class="card lisered settings-form" @submit.prevent="save">
      <h3 class="settings-group">{{ store.t("admin.settings.identity") }}</h3>
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

      <div class="form-row">
        <div class="form-field">
          <label>{{ store.t("admin.settings.site-url") }}</label>
          <input v-model="form.site_url" type="url" placeholder="https://…" />
        </div>
        <div class="form-field">
          <label>{{ store.t("admin.settings.favicon") }}</label>
          <input v-model="form.favicon_url" type="url" placeholder="https://…/favicon.png" />
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

      <h3 class="settings-group">{{ store.t("admin.settings.appearance") }}</h3>
      <div class="form-row three">
        <div class="form-field">
          <label>{{ store.t("admin.settings.accent") }}</label>
          <div class="color-row">
            <input
              type="color"
              :value="form.accent_color || THEME_COLORS.accent_color"
              @input="onColor('accent_color', $event)"
            />
            <input v-model="form.accent_color" type="text" class="mono" maxlength="7" :placeholder="store.t('common.default')" />
          </div>
        </div>
        <div class="form-field">
          <label>{{ store.t("admin.settings.ok-color") }}</label>
          <div class="color-row">
            <input
              type="color"
              :value="form.ok_color || THEME_COLORS.ok_color"
              @input="onColor('ok_color', $event)"
            />
            <input v-model="form.ok_color" type="text" class="mono" maxlength="7" :placeholder="store.t('common.default')" />
          </div>
        </div>
        <div class="form-field">
          <label>{{ store.t("admin.settings.down-color") }}</label>
          <div class="color-row">
            <input
              type="color"
              :value="form.down_color || THEME_COLORS.down_color"
              @input="onColor('down_color', $event)"
            />
            <input v-model="form.down_color" type="text" class="mono" maxlength="7" :placeholder="store.t('common.default')" />
          </div>
        </div>
      </div>

      <div class="form-row">
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
      </div>

      <h3 class="settings-group">{{ store.t("admin.settings.behavior") }}</h3>
      <div class="form-row">
        <div class="form-field">
          <label>{{ store.t("admin.settings.history") }}</label>
          <input v-model.number="form.history_days" type="number" min="7" max="365" />
        </div>
        <div class="form-field">
          <label>{{ store.t("admin.settings.retention") }}</label>
          <input v-model.number="form.retention_days" type="number" min="7" max="3650" />
        </div>
      </div>

      <div class="toggles">
        <label class="toggle">
          <input v-model="form.default_show_uptime" type="checkbox" />
          {{ store.t("admin.settings.default-show-uptime") }}
        </label>
        <label class="toggle">
          <input v-model="form.default_show_response_time" type="checkbox" />
          {{ store.t("admin.settings.default-show-rt") }}
        </label>
        <label class="toggle">
          <input v-model="form.show_incidents_history" type="checkbox" />
          {{ store.t("admin.settings.show-incidents") }}
        </label>
      </div>

      <p v-if="formError" class="form-error">{{ formError }}</p>
      <p v-if="saved" class="form-success">{{ store.t("common.saved") }}</p>

      <div class="form-actions">
        <button type="submit" class="btn" :disabled="saving">{{ store.t("common.save") }}</button>
      </div>
    </form>

    <aside class="card account-card">
      <h3 class="settings-group">{{ store.t("admin.account.title") }}</h3>
      <p class="muted account-intro">{{ store.t("admin.account.intro") }}</p>
      <button type="button" class="btn ghost" @click="openAccount">
        {{ store.t("admin.account.edit") }}
      </button>
    </aside>

    <Modal v-if="accountOpen" :title="store.t('admin.account.title')" @close="closeAccount">
      <form class="form" @submit.prevent="saveAccount">
        <div class="form-field">
          <label for="account-username">{{ store.t("admin.account.username") }}</label>
          <input
            id="account-username"
            v-model="account.username"
            type="text"
            minlength="3"
            maxlength="64"
            autocomplete="username"
            :disabled="accountLoading"
            required
          />
        </div>
        <div class="form-field">
          <label for="account-current">{{ store.t("admin.account.current") }}</label>
          <input
            id="account-current"
            v-model="account.current_password"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>
        <div class="form-field">
          <label for="account-new">{{ store.t("admin.account.new") }}</label>
          <input
            id="account-new"
            v-model="account.new_password"
            type="password"
            minlength="8"
            maxlength="128"
            autocomplete="new-password"
          />
          <p class="form-hint">{{ store.t("admin.account.new-hint") }}</p>
        </div>

        <p v-if="accountError" class="form-error">{{ accountError }}</p>
        <p v-if="accountSaved" class="form-success">{{ store.t("admin.account.saved") }}</p>

        <div class="form-actions">
          <button type="button" class="btn ghost" @click="closeAccount">
            {{ store.t("common.close") }}
          </button>
          <button type="submit" class="btn" :disabled="accountSaving">
            {{ store.t("common.save") }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<style scoped>
.settings-layout {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  max-width: 760px;
}

.settings-form {
  padding-bottom: 1.6rem;
}

.settings-group {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.5rem;
  margin: 1.8rem 0 1.1rem;
}

.settings-group:first-child {
  margin-top: 0.4rem;
}

.account-intro {
  margin: 0 0 1rem;
  font-size: 0.88rem;
}
</style>
