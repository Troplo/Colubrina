import Vue from "vue"
import Vuex from "vuex"
import Vuetify from "../plugins/vuetify"
import AjaxErrorHandler from "@/lib/errorHandler.js"

Vue.use(Vuex)
function getDirectRecipient(context, item) {
  let user = item.chat.users.find((user) => user.id !== context.state.user.id)
  if (user) {
    if (user.nickname?.nickname) {
      user.name = user.nickname.nickname
    } else {
      user.name = user.username
    }
    return user
  } else {
    let user = item.chat.users[0]
    if (user.nickname?.nickname) {
      user.name = user.nickname.nickname
    } else {
      user.name = user.username
    }
    return user
  }
}
export default new Vuex.Store({
  state: {
    desktop: !!process.env.IS_ELECTRON,
    online: true,
    selectedChat: null,
    chats: [],
    baseURL: process.env.VUE_APP_BASE_URL,
    lastRoute: null,
    versioning: {
      date: process.env.VUE_APP_BUILD_DATE,
      version: process.env.VUE_APP_VERSION,
      release: process.env.RELEASE
    },
    context: {
      pins: {
        x: null,
        y: null,
        value: false
      }
    },
    drawer: true,
    site: {
      release: "stable",
      loading: true,
      name: "Colourbrina",
      emailVerification: false
    },
    user: {
      bcUser: null,
      loggedIn: false
    },
    token: null,
    modals: {
      guidedWizard: true,
      settings: false,
      search: false
    },
    quickSwitchCache: [],
    themeEngine: {
      cssEnabled: true,
      theme: {},
      cssEditor: false,
      editor: false,
      type: "create",
      autoCSS: false
    },
    communicationNotifications: 0,
    wsConnected: false,
    wsRegistered: false,
    lastChat: "friends",
    searchPanel: false,
    userPanel: false,
    messages: {}
  },
  mutations: {
    setMessages(state, { id, messages }) {
      state.messages[id] = messages
    },
    appendMessage(state, { id, message }) {
      state.messages[id].push(message)
    },
    setSelectedChat(state, chat) {
      state.selectedChat = chat
    },
    setChats(state, chats) {
      state.chats = chats
    },
    setLastChat(state, payload) {
      state.lastChat = payload
    },
    setWSConnected(state, value) {
      state.wsConnected = value
    },
    setCommunicationNotifications(state, payload) {
      state.communicationNotifications = payload
    },
    setThemeEngine(state, payload) {
      state.themeEngine = payload
    },
    setThemeEngineTheme(state, payload) {
      state.themeEngine.theme = payload
    },
    setThemeEngineCSSEditor(state, payload) {
      state.themeEngine.cssEditor = payload
    },
    setThemeEngineEditor(state, payload) {
      state.themeEngine.editor = payload
    },
    setThemeEngineType(state, payload) {
      state.themeEngine.type = payload
    },
    setOnline(state, online) {
      state.online = online
    },
    setUser(state, user) {
      state.user = user
    },
    setSite(state, site) {
      state.site = site
    },
    setToken(state, token) {
      state.token = token
    },
    setLoading(state, value) {
      state.site.loading = value
    },
    showSettings(state, value) {
      state.modals.settings = value
    },
    setSearch(state, value) {
      state.modals.search = value
    },
    addChat(state, chat) {
      state.chats.unshift(chat)
    },
    updateQuickSwitchCache(state, value) {
      state.quickSwitchCache.push({
        ...value,
        subjectLongName: value.name
          ? value.subjectLongName + " (" + value.name + ")"
          : value.subjectLongName
      })
    }
  },
  actions: {
    getChats(context) {
      Vue.axios.defaults.headers.common["Authorization"] =
        localStorage.getItem("token")
      Vue.axios
        .get("/api/v1/communications")
        .then((res) => {
          context.commit("setChats", res.data)
          context.dispatch("getCommunicationsUnread")
          context.dispatch("updateQuickSwitch")
        })
        .catch(() => {})
    },
    getCommunicationsUnread(context) {
      Vue.axios
        .get(process.env.VUE_APP_BASE_URL + "/api/v1/communications")
        .then((res) => {
          context.commit("setChats", res.data)
          context.dispatch("updateQuickSwitch")
          context.state.communicationNotifications = 0
          res.data.forEach((item) => {
            context.state.communicationNotifications += item.unread
          })
        })
        .catch(() => {})
    },
    discardTheme(context) {
      context.state.themeEngine.theme = {
        id: 1,
        name: "Colourbrina Classic",
        primaryType: "all",
        css: "",
        dark: {
          primary: "#0190ea",
          secondary: "#757575",
          accent: "#000000",
          error: "#ff1744",
          info: "#2196F3",
          success: "#4CAF50",
          warning: "#ff9800",
          card: "#151515",
          toolbar: "#191919",
          sheet: "#181818",
          text: "#000000",
          dark: "#151515",
          bg: "#151515"
        },
        light: {
          primary: "#0190ea",
          secondary: "#757575",
          accent: "#000000",
          error: "#ff1744",
          info: "#2196F3",
          success: "#4CAF50",
          warning: "#ff9800",
          card: "#f8f8f8",
          toolbar: "#f8f8f8",
          sheet: "#f8f8f8",
          text: "#000000",
          dark: "#f8f8f8",
          bg: "#f8f8f8"
        }
      }
      context.state.themeEngine.type = "create"
    },
    saveTheme(context, { theme, type }) {
      if (context.state.themeEngine.type === "create" || type === "copy") {
        Vue.axios
          .post("/api/v1/themes", {
            name:
              type === "copy"
                ? context.state.themeEngine.theme.name + " - Copy"
                : context.state.themeEngine.theme.name,
            theme: theme || context.state.themeEngine.theme
          })
          .then(() => {})
          .catch((e) => {
            AjaxErrorHandler(this.$store)(e)
          })
      } else {
        Vue.axios
          .put("/api/v1/themes/" + context.state.themeEngine.theme.id, {
            name: context.state.themeEngine.theme.name,
            theme: theme || context.state.themeEngine.theme
          })
          .then(() => {})
          .catch((e) => {
            AjaxErrorHandler(this.$store)(e)
          })
      }
    },
    toggleCSS(context) {
      const element = document.getElementById("user-theme")
      if (element) {
        element.parentNode.removeChild(element)
      }
      if (!context.state.themeEngine.cssEnabled) {
        const style = document.createElement("style")
        style.id = "user-theme"
        style.innerHTML =
          context.state.themeEngine.theme.css ||
          context.state.user?.themeObject?.theme?.css
        document.head.appendChild(style)
      }
      context.state.themeEngine.cssEnabled =
        !context.state.themeEngine.cssEnabled
    },
    applyCSS(context, theme) {
      const element = document.getElementById("user-theme")
      if (element) {
        element.parentNode.removeChild(element)
      }
      if (!theme) {
        const style = document.createElement("style")
        style.id = "user-theme"
        style.innerHTML = context.state.themeEngine.theme.css
        document.head.appendChild(style)
      } else {
        const style = document.createElement("style")
        style.id = "user-theme"
        style.innerHTML = context.state.themeEngine.theme.css
        document.head.appendChild(style)
      }
    },
    checkAuth() {
      return new Promise((resolve, reject) => {
        Vue.axios.defaults.headers.common["Authorization"] =
          localStorage.getItem("token")
        Vue.axios
          .get("/api/v1/user")
          .then(() => {
            resolve(true)
          })
          .catch((e) => {
            if (e?.response?.status === 401) {
              reject(false)
            } else {
              AjaxErrorHandler(this.$store)(e)
            }
          })
      })
    },
    logout(context) {
      localStorage.removeItem("userCache")
      localStorage.removeItem("token")
      Vue.axios.defaults.headers.common["Authorization"] = null
      context.commit("setUser", {
        bcUser: null,
        loggedIn: false
      })
    },
    generateCache() {
      // todo
    },
    getState(context) {
      Vue.axios
        .get("/api/v1/state?v=" + context.state.versioning.version)
        .then((res) => {
          context.commit("setOnline", true)
          context.commit("setSite", res.data)
          context.commit("setLoading", false)
        })
        .catch(() => {
          context.commit("setSite", {
            release: "stable",
            loading: false,
            notification: "",
            latestVersion: "1.0.0"
          })
          context.commit("setOnline", false)
          context.commit("setLoading", false)
        })
    },
    updateQuickSwitch(context) {
      context.state.quickSwitchCache = []
      context.commit("updateQuickSwitchCache", {
        subjectLongName: "Home",
        customType: 1,
        route: "/communications/friends"
      })
      context.state.chats.forEach((chat) => {
        context.commit("updateQuickSwitchCache", {
          id: chat.id,
          subjectLongName:
            chat.chat.type === "group"
              ? chat.chat.name
              : getDirectRecipient(context, chat).name,
          customType: 3
        })
      })
    },
    saveOnlineSettings(context, setting) {
      return new Promise((resolve, reject) => {
        if (setting) {
          Vue.axios
            .put("/api/v1/user/settings/full", {
              ...context.state.user,
              ...setting
            })
            .then((res) => {
              resolve(res.data)
            })
            .catch((e) => {
              reject(e.response.data)
            })
        } else {
          Vue.axios
            .put("/api/v1/user/settings/full", {
              ...context.state.user
            })
            .then((res) => {
              resolve(res.data)
            })
            .catch((e) => {
              reject(e.response.data)
            })
        }
      })
    },
    doInit(context) {
      if (context.state.desktop) {
        Vue.axios.defaults.baseURL = localStorage.getItem("instance")
        context.state.baseURL = localStorage.getItem("instance")
      }
      Vue.axios.defaults.headers.common["X-Colourbrina"] = true
      Vue.axios.defaults.headers.common["X-Colourbrina-Version"] =
        context.state.versioning.version
      Vue.axios.defaults.headers.common["Authorization"] =
        localStorage.getItem("token")
      if (localStorage.getItem("customHeaders")) {
        for (let header in JSON.parse(localStorage.getItem("customHeaders"))) {
          Vue.axios.defaults.headers[header] = JSON.parse(
            localStorage.getItem("customHeaders")
          )[header]
        }
      }
    },
    getUserInfo(context) {
      function setUser(user) {
        try {
          Vue.$socket.emit("connection", {
            message: true
          })
        } catch {
          console.log("Socket not connected")
        }
        localStorage.setItem("userCache", JSON.stringify(user))
        const name = user.themeObject.id
        const dark = user.themeObject.theme.dark
        const light = user.themeObject.theme.light
        if (user.accentColor) {
          user.themeObject.theme.dark.primary = user.accentColor
          user.themeObject.theme.light.primary = user.accentColor
        }
        Vuetify.framework.theme.themes.dark = dark
        Vuetify.framework.theme.themes.light = light
        Vuetify.framework.theme.themes.name = name
        Vuetify.framework.theme.themes.primaryType =
          user.themeObject.theme.primaryType
        const themeElement = document.getElementById("user-theme")
        if (!themeElement) {
          const style = document.createElement("style")
          style.id = "user-theme"
          style.innerHTML = user.themeObject.theme.css
          document.head.appendChild(style)
        }
        const fontElement = document.getElementById("user-font")
        if (!fontElement) {
          const style = document.createElement("style")
          style.id = "user-font"
          style.innerHTML = `/* Stop from font breaking CSS code editor */
.ace_editor div {
 font-family: "JetBrains Mono" !important;
}

div {
 font-family: "${user.font}", sans-serif;
}
`
          document.head.appendChild(style)
        }
        context.commit("setLoading", false)
        context.commit("setUser", user)
      }
      Vue.axios.defaults.headers.common["Authorization"] =
        localStorage.getItem("token")
      return new Promise((resolve, reject) => {
        try {
          const user = JSON.parse(localStorage.getItem("userCache"))
          if (user?.id) {
            setUser(user)
          }
        } catch {
          //
        }
        Vue.axios
          .get("/api/v1/user")
          .then((res) => {
            setUser(res.data)
            context.commit("setLoading", false)
            context.commit("setOnline", true)
            resolve(res.data)
          })
          .catch((e) => {
            try {
              const user = JSON.parse(localStorage.getItem("userCache"))
              if (user?.id && !e?.response?.data?.errors?.length) {
                setUser(user)
              } else {
                const theme = {
                  id: 1,
                  name: "Colourbrina Classic",
                  primaryType: "all",
                  dark: {
                    primary: "#0190ea",
                    secondary: "#757575",
                    accent: "#000000",
                    error: "#ff1744",
                    info: "#2196F3",
                    success: "#4CAF50",
                    warning: "#ff9800",
                    card: "#151515",
                    toolbar: "#191919",
                    sheet: "#181818",
                    text: "#000000",
                    dark: "#151515",
                    bg: "#151515"
                  },
                  light: {
                    primary: "#0190ea",
                    secondary: "#757575",
                    accent: "#000000",
                    error: "#ff1744",
                    info: "#2196F3",
                    success: "#4CAF50",
                    warning: "#ff9800",
                    card: "#f8f8f8",
                    toolbar: "#f8f8f8",
                    sheet: "#f8f8f8",
                    text: "#000000",
                    dark: "#f8f8f8",
                    bg: "#f8f8f8"
                  }
                }
                const name = theme.id
                const dark = theme.dark
                const light = theme.light
                Vuetify.framework.theme.themes.dark = dark
                Vuetify.framework.theme.themes.light = light
                Vuetify.framework.theme.themes.name = name
                this.name = name
                console.log("Failed to load Colourbrina Account")
                context.user = null
                localStorage.removeItem("userCache")
                reject(e)
              }
            } catch {
              const theme = {
                id: 1,
                name: "Colourbrina Classic",
                primaryType: "all",
                dark: {
                  primary: "#0190ea",
                  secondary: "#757575",
                  accent: "#000000",
                  error: "#ff1744",
                  info: "#2196F3",
                  success: "#4CAF50",
                  warning: "#ff9800",
                  card: "#151515",
                  toolbar: "#191919",
                  sheet: "#181818",
                  text: "#000000",
                  dark: "#151515",
                  bg: "#151515"
                },
                light: {
                  primary: "#0190ea",
                  secondary: "#757575",
                  accent: "#000000",
                  error: "#ff1744",
                  info: "#2196F3",
                  success: "#4CAF50",
                  warning: "#ff9800",
                  card: "#f8f8f8",
                  toolbar: "#f8f8f8",
                  sheet: "#f8f8f8",
                  text: "#000000",
                  dark: "#f8f8f8",
                  bg: "#f8f8f8"
                }
              }
              const name = theme.id
              const dark = theme.dark
              const light = theme.light
              Vuetify.framework.theme.themes.dark = dark
              Vuetify.framework.theme.themes.light = light
              Vuetify.framework.theme.themes.name = name
              this.name = name
              console.log("Failed to load Colourbrina Account")
              localStorage.removeItem("userCache")
              context.user = null
              reject(e)
            }
            if (!localStorage.getItem("userCache")) {
              const theme = {
                id: 1,
                name: "Colourbrina Classic",
                primaryType: "all",
                dark: {
                  primary: "#0190ea",
                  secondary: "#757575",
                  accent: "#000000",
                  error: "#ff1744",
                  info: "#2196F3",
                  success: "#4CAF50",
                  warning: "#ff9800",
                  card: "#151515",
                  toolbar: "#191919",
                  sheet: "#181818",
                  text: "#000000",
                  dark: "#151515",
                  bg: "#151515"
                },
                light: {
                  primary: "#0190ea",
                  secondary: "#757575",
                  accent: "#000000",
                  error: "#ff1744",
                  info: "#2196F3",
                  success: "#4CAF50",
                  warning: "#ff9800",
                  card: "#f8f8f8",
                  toolbar: "#f8f8f8",
                  sheet: "#f8f8f8",
                  text: "#000000",
                  dark: "#f8f8f8",
                  bg: "#f8f8f8"
                }
              }
              const name = theme.id
              const dark = theme.dark
              const light = theme.light
              Vuetify.framework.theme.themes.dark = dark
              Vuetify.framework.theme.themes.light = light
              Vuetify.framework.theme.themes.name = name
              this.name = name
              console.log("Failed to load Colourbrina Account")
              context.user = null
              reject(e)
            }
          })
      })
    }
  },
  modules: {}
})
