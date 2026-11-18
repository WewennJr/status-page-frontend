import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { detectLang, t as translate, type Lang } from "@/i18n"

export type Theme = "light" | "dark"

export const useAppStore = defineStore("app", () => {
  const lang = ref<Lang>((localStorage.getItem("sp-lang") as Lang) || "fr")
  const theme = ref<Theme>(
    localStorage.getItem("sp-theme") === "light" ? "light" : "dark",
  )
  const settings = ref<Record<string, string>>({})

  function setLang(value: Lang) {
    lang.value = value
    localStorage.setItem("sp-lang", value)
    document.documentElement.lang = value
  }

  function applyTheme(value: Theme) {
    theme.value = value
    localStorage.setItem("sp-theme", value)
    document.documentElement.setAttribute("data-theme", value)
  }

  function toggleTheme() {
    applyTheme(theme.value === "dark" ? "light" : "dark")
  }

  /** Applique les settings reçus du backend (thème par défaut, langue, couleur d'accent) */
  function ingestSettings(values: Record<string, string>) {
    settings.value = values
    if (!localStorage.getItem("sp-lang")) {
      const detected = detectLang(values.default_language ?? "fr")
      lang.value = detected
      document.documentElement.lang = detected
    }
    if (!localStorage.getItem("sp-theme")) {
      const themePref = values.default_theme ?? "system"
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      const resolved =
        themePref === "light"
          ? "light"
          : themePref === "dark"
            ? "dark"
            : prefersDark
              ? "dark"
              : "light"
      theme.value = resolved
      document.documentElement.setAttribute("data-theme", resolved)
    }
    if (values.accent_color) {
      document.documentElement.style.setProperty("--accent", values.accent_color)
    }
  }

  const t = computed(() => (key: string) => translate(lang.value, key))

  return { lang, theme, settings, setLang, toggleTheme, applyTheme, ingestSettings, t }
})
