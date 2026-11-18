<script setup lang="ts">
import { ref } from "vue"
import { useRoute, useRouter, RouterLink } from "vue-router"
import { post } from "@/api/client"
import HeaderControls from "@/components/HeaderControls.vue"
import { useAppStore } from "@/stores/app"

const store = useAppStore()
const router = useRouter()
const route = useRoute()

const username = ref("")
const password = ref("")
const error = ref("")
const submitting = ref(false)

async function submit() {
  error.value = ""
  submitting.value = true
  try {
    await post("/api/auth/login", {
      username: username.value,
      password: password.value,
    })
    const redirect = route.query.redirect
    await router.push(typeof redirect === "string" ? redirect : { name: "admin" })
  } catch {
    error.value = store.t("login.error")
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
      <h1 class="display">{{ store.t("login.title") }}</h1>

      <form class="card lisered" @submit.prevent="submit">
        <div class="form">
          <div class="form-field">
            <label for="username">{{ store.t("setup.username") }}</label>
            <input
              id="username"
              v-model="username"
              type="text"
              autocomplete="username"
              required
            />
          </div>
          <div class="form-field">
            <label for="password">{{ store.t("setup.password") }}</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>

          <p v-if="error" class="form-error">{{ error }}</p>

          <button class="form-button" type="submit" :disabled="submitting">
            {{ store.t("login.submit") }}
          </button>
        </div>
      </form>

      <p class="form-hint back-hint">
        <RouterLink to="/">{{ store.t("login.back") }}</RouterLink>
      </p>
    </div>
  </main>
</template>

<style scoped>
.back-hint {
  margin-top: 1.2rem;
  text-align: center;
}
</style>
