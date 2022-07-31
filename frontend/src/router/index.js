import Vue from "vue"
import VueRouter from "vue-router"

Vue.use(VueRouter)

const routes = [
  {
    path: "/",
    redirect: "/communications",
    name: "Communications"
  },
  {
    path: "/communications",
    name: "Communications",
    children: [
      {
        path: "friends",
        name: "Friends",
        component: () =>
          import(
            /* webpackChunkName: "communicationsFriends" */ "../views/Communications/CommunicationsFriends"
          )
      },
      {
        path: ":id",
        name: "Communications",
        component: () =>
          import(
            /* webpackChunkName: "communicationsChat" */ "../views/Communications/CommunicationsChat"
          )
      }
    ],
    component: () =>
      import(
        /* webpackChunkName: "communications" */ "../views/Communications/Communications"
      )
  },
  {
    path: "/login",
    name: "Login",
    component: () =>
      import(/* webpackChunkName: "login" */ "../views/Login.vue")
  },
  {
    path: "/register",
    name: "Register",
    component: () =>
      import(/* webpackChunkName: "register" */ "../views/Register.vue")
  },
  {
    path: "/settings",
    redirect: "/settings/site",
    children: [
      {
        path: "site",
        name: "Website Settings",
        component: () =>
          import(
            /* webpackChunkName: "settingsSite" */ "../views/Settings/SettingsSite"
          )
      },
      {
        path: "appearance",
        name: "Appearance Settings",
        component: () =>
          import(
            /* webpackChunkName: "settingsAppearance" */ "../views/Settings/SettingsAppearance"
          )
      },
      {
        path: "security",
        name: "Security Settings",
        component: () =>
          import(
            /* webpackChunkName: "settingsAppearance" */ "../views/Settings/SettingsSecurity"
          )
      },
      {
        path: "sessions",
        name: "Session Settings",
        component: () =>
          import(
            /* webpackChunkName: "settingsSessions" */ "../views/Settings/SettingsSessions"
          )
      },
      {
        path: "communications",
        name: "Communications Settings",
        component: () =>
          import(
            /* webpackChunkName: "settingsCommunications" */ "../views/Settings/SettingsCommunications"
          )
      }
    ],
    component: () =>
      import(/* webpackChunkName: "settings" */ "../views/Settings/Settings")
  },
  {
    path: "/admin",
    name: "Admin",
    redirect: "/admin/dashboard",
    children: [
      {
        path: "dashboard",
        name: "Admin Dashboard",
        component: () =>
          import(
            /* webpackChunkName: "adminHome" */ "../views/Admin/AdminHome.vue"
          )
      },
      {
        path: "users",
        name: "Admin Users",
        component: () =>
          import(
            /* webpackChunkName: "adminUsers" */ "../views/Admin/AdminUsers.vue"
          )
      },
      {
        path: "themes",
        name: "Themes",
        component: () =>
          import(
            /* webpackChunkName: "adminThemes" */ "../views/Admin/AdminThemes.vue"
          )
      },
      {
        path: "state",
        name: "Site Settings",
        component: () =>
          import(
            /* webpackChunkName: "adminState" */ "../views/Admin/AdminState.vue"
          )
      },
      {
        path: "logs",
        name: "Site Logs",
        component: () =>
          import(
            /* webpackChunkName: "adminLogs" */ "../views/Admin/AdminLogs.vue"
          )
      }
    ],
    component: () =>
      import(/* webpackChunkName: "admin" */ "../views/Admin/Admin.vue")
  },
  {
    path: "/about",
    name: "About",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue")
  },
  {
    path: "/email/verify",
    name: "Email Verify",
    component: () =>
      import(
        /* webpackChunkName: "emailVerify" */ "../views/Email/EmailVerify.vue"
      )
  },
  {
    path: "/email/confirm/:token",
    name: "Email Confirm",
    component: () =>
      import(
        /* webpackChunkName: "emailConfirm" */ "../views/Email/EmailConfirm.vue"
      )
  },
  {
    path: "*",
    name: "Not Found",
    component: () =>
      import(/* webpackChunkName: "notFound" */ "../views/NotFound")
  }
]

const router = new VueRouter({
  mode: process.env.IS_ELECTRON ? "hash" : "history",
  base: process.env.BASE_URL,
  routes
})

const originalPush = router.push
router.push = function push(location, onResolve, onReject) {
  if (onResolve || onReject)
    return originalPush.call(this, location, onResolve, onReject)
  return originalPush.call(this, location).catch((err) => err)
}

export default router
