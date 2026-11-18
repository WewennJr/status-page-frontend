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
const error = ref("")
const submitting = ref(false)
const done = ref(false)

const canSubmit = computed(() => username.value.length >= 3 && password.value.length >= 8)

onMounted(() => {
  get<{ setup_required: boolean }>("/api/setup-required")
    .then((res) => {
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
.intro {
  margin: 0.6rem 0 1.6rem;
  font-size: 0.88rem;
}
</style>
