<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { get, post } from "@/api/client"
import HeaderControls from "@/components/HeaderControls.vue"
import { useAppStore } from "@/stores/app"

const store = useAppStore()
const router = useRouter()

const username = ref("")
const password = ref("")
const password2 = ref("")
const token = ref("")
const tokenRequired = ref(false)
const error = ref("")
const submitting = ref(false)
const done = ref(false)

const canSubmit = computed(() => username.value.length >= 3 && password.value.length >= 8)

onMounted(() => {
  get<{ setup_required: boolean; token_required: boolean }>("/api/setup-required")
    .then((res) => {
      tokenRequired.value = res.token_required
      if (!res.setup_required) router.replace({ name: "status" })
    })
    .catch(() => {})
})

async function submit() {
  error.value = ""
  if (password.value !== password2.value) {
    error.value = store.t("setup.error.match")
    return
  }
  submitting.value = true
  try {
    await post("/api/setup", {
      username: username.value,
      password: password.value,
      token: token.value,
    })
    done.value = true
    setTimeout(() => router.push({ name: "admin" }), 800)
  } catch {
    error.value = store.t("common.error")
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="auth-main">
    <header class="page-header auth-header">
      <div class="brand">{{ store.t("app.title") }}</div>
      <HeaderControls />
    </header>

    <div class="page">
      <h1 class="display">{{ store.t("setup.title") }}</h1>
      <p class="muted intro">{{ store.t("setup.intro") }}</p>

      <form class="card lisered" @submit.prevent="submit">
        <div class="form">
          <div v-if="tokenRequired" class="form-field">
            <label for="token">{{ store.t("setup.token") }}</label>
            <input id="token" v-model="token" type="password" autocomplete="off" required />
          </div>
          <div class="form-field">
            <label for="username">{{ store.t("setup.username") }}</label>
            <input
              id="username"
              v-model="username"
              type="text"
              autocomplete="username"
              minlength="3"
              required
            />
          </div>
          <div class="form-field">
            <label for="password">{{ store.t("setup.password") }}</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              minlength="8"
              required
            />
            <p class="form-hint hint-left">{{ store.t("setup.error.short") }}</p>
          </div>
          <div class="form-field">
            <label for="password2">{{ store.t("setup.password2") }}</label>
            <input
              id="password2"
              v-model="password2"
              type="password"
              autocomplete="new-password"
              required
            />
          </div>

          <p v-if="error" class="form-error">{{ error }}</p>
          <p v-if="done" class="form-success">{{ store.t("setup.done") }}</p>

          <button class="form-button" type="submit" :disabled="submitting || !canSubmit || done">
            {{ store.t("setup.submit") }}
          </button>
        </div>
      </form>
    </div>
  </main>
</template>

<style scoped>
.auth-main {
  position: relative;
  z-index: 1;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 1.4rem 1.25rem 3rem;
}

.auth-header {
  max-width: 380px;
  width: 100%;
  margin: 0 auto 2rem;
}

.page {
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
}

.intro {
  margin: 0.6rem 0 1.6rem;
  font-size: 0.88rem;
}

.form-button {
  background: var(--text);
  color: var(--ink);
  border: 1px solid var(--text);
  border-radius: 3px;
  padding: 0.85rem 1.25rem;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  width: 100%;
  margin-top: 0.4rem;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.form-button:hover:not(:disabled) {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}

.form-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
