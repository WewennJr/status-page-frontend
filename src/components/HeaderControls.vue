<script setup lang="ts">
import { useAppStore, type Theme } from "@/stores/app"

const store = useAppStore()

function cycleTheme() {
  const order: Theme[] = ["dark", "light"]
  const current = order.indexOf(store.theme)
  const next = order[(current + 1) % order.length] ?? "dark"
  store.applyTheme(next)
}

function cycleLang() {
  store.setLang(store.lang === "fr" ? "en" : "fr")
}

function themeLabel(): string {
  return store.theme === "dark" ? "☾" : "☀"
}
</script>

<template>
  <div class="header-actions">
    <button class="icon-btn" @click="cycleLang" :title="store.t('theme.system')">
      {{ store.lang.toUpperCase() }}
    </button>
    <button class="icon-btn" @click="cycleTheme" :title="store.t('theme.' + store.theme)">
      {{ themeLabel() }}
    </button>
  </div>
</template>
