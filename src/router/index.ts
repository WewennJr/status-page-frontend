import { createRouter, createWebHistory } from "vue-router"
import { get } from "@/api/client"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "status",
      component: () => import("@/views/StatusView.vue"),
    },
    {
      path: "/setup",
      name: "setup",
      component: () => import("@/views/SetupView.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("@/views/AdminView.vue"),
      meta: { requiresAuth: true },
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
})

router.beforeEach(async (to) => {
  let setupRequired = false
  try {
    const res = await get<{ setup_required: boolean }>("/api/setup-required")
    setupRequired = res.setup_required
  } catch {
    setupRequired = false
  }
  if (setupRequired && to.name !== "setup") return { name: "setup" }
  if (!setupRequired && to.name === "setup") return { name: "status" }
  if (to.meta.requiresAuth) {
    try {
      const me = await get<{ authenticated: boolean }>("/api/auth/me")
      if (!me.authenticated) {
        return { name: "login", query: { redirect: to.fullPath } }
      }
    } catch {
      return { name: "login", query: { redirect: to.fullPath } }
    }
  }
  return true
})

export default router
