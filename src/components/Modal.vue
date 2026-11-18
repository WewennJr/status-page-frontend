<script setup lang="ts">
import { onMounted, onUnmounted } from "vue"

const props = defineProps<{ title: string }>()
const emit = defineEmits<{ (e: "close"): void }>()

function onKey(event: KeyboardEvent) {
  if (event.key === "Escape") emit("close")
}

onMounted(() => window.addEventListener("keydown", onKey))
onUnmounted(() => window.removeEventListener("keydown", onKey))
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="emit('close')">
      <div class="card lisered modal-panel" role="dialog" aria-modal="true" :aria-label="props.title">
        <header class="modal-head">
          <h2>{{ props.title }}</h2>
          <button type="button" class="icon-btn" @click="emit('close')" aria-label="Fermer">×</button>
        </header>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
