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

  /** Apply settings received from the backend (theme, language, colors, favicon, title) */
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

    const root = document.documentElement
    const customColors: Array<[string, string]> = [
      ["accent_color", "--accent-custom"],
      ["ok_color", "--ok-custom"],
      ["down_color", "--down-custom"],
    ]
    for (const [key, cssVar] of customColors) {
      const value = values[key]
      if (value) root.style.setProperty(cssVar, value)
      else root.style.removeProperty(cssVar)
    }

    if (values.site_name) document.title = values.site_name

    const icon = values.favicon_url || (/^https?:\/\//.test(values.site_icon ?? "") ? values.site_icon : "")
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (icon) {
      if (!link) {
        link = document.createElement("link")
        link.rel = "icon"
        link.dataset.dynamic = "true"
        document.head.appendChild(link)
      }
      link.href = icon
    } else if (link && link.dataset.dynamic === "true") {
      link.remove()
    }
  }

  const t = computed(() => (key: string) => translate(lang.value, key))

  return { lang, theme, settings, setLang, toggleTheme, applyTheme, ingestSettings, t }
})
