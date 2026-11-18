<script setup lang="ts">
import { computed } from "vue"
import { useAppStore } from "@/stores/app"

const props = defineProps<{
  status: "up" | "down" | "unknown"
}>()

const store = useAppStore()
const label = computed(
  () => store.t(`status.${props.status}`) as string,
)
</script>

<template>
  <span class="status-badge" :class="status">{{ label }}</span>
</template>
