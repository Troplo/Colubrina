<template>
  <div id="settings-appearance">
    <v-card-text>
      <v-switch
        v-model="$store.state.user.theme"
        true-value="dark"
        false-value="light"
        inset
        label="Dark theme"
        @change="saveSettings"
      />
    </v-card-text>
    <v-alert
      v-if="
        ($vuetify.theme.themes.primaryType === 'light' &&
          $vuetify.theme.dark) ||
        ($vuetify.theme.themes.primaryType === 'dark' && !$vuetify.theme.dark)
      "
      class="mx-6"
      outlined
      type="warning"
    >
      You currently have a theme enabled that is not designed for your selected
      base theme.
    </v-alert>
    <v-card-text>
      <v-switch
        v-model="defineAccent"
        inset
        label="Use a custom accent color (overrides theme's primary attribute)."
      />
      <v-color-picker
        v-if="defineAccent"
        v-model="accent"
        hide-canvas
        value="hex"
        hide-inputs
        show-swatches
        swatches-max-height="132"
      />
    </v-card-text>
    <v-col sm="4">
      <v-select
        v-model="$store.state.user.font"
        :items="fonts"
        label="Font"
        item-text="name"
        item-value="name"
        @change="setFont"
      />
    </v-col>
    <v-card-text>
      <v-card
        v-for="(theme, index) in computeThemes"
        :key="index"
        class="my-2"
        hover
        outlined
        color="card"
        @click="setTheme(theme)"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="font-weight-bold">
              {{ theme.name }}
              <v-btn text fab small @click="download(theme)">
                <v-icon>mdi-download</v-icon>
              </v-btn>
              <v-btn
                v-if="theme.userId === $store.state.user.id"
                text
                fab
                small
                @click="initEditTheme(theme)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                v-if="theme.userId === $store.state.user.id"
                text
                fab
                small
                @click="doDeleteTheme(theme)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
              <v-btn text fab small @click="doCreateTheme('copy', theme)">
                <v-icon>mdi-content-copy</v-icon>
              </v-btn>
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ theme.public ? "Public" : "Private" }}, created by
              {{ theme.user.username }}
              <v-btn v-if="theme.css" small text> Custom CSS </v-btn>
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-avatar v-if="name === theme.id" color="success" size="30">
              <v-icon>mdi-check</v-icon>
            </v-avatar>
          </v-list-item-action>
        </v-list-item>
        <div v-if="$vuetify.theme.dark" class="my-2">
          <v-chip-group>
            <v-chip
              v-for="(key, index) in Object.keys(theme.dark)"
              :key="index"
              disabled
              style="opacity: 1"
              class="mx-1"
              label
              :color="theme.dark[key]"
            >
              {{ friendlyName(key) }}
            </v-chip>
          </v-chip-group>
        </div>
        <div v-if="!$vuetify.theme.dark" class="my-2">
          <v-chip-group column>
            <v-chip
              v-for="(key, index) in Object.keys(theme.light)"
              :key="index"
              class="mx-1"
              label
              :color="theme.light[key]"
            >
              {{ key }}
            </v-chip>
          </v-chip-group>
        </div>
      </v-card>
      <v-container class="text-center justify-center">
        <v-chip x-large outlined fab @click="initThemeCreator">
          <v-icon x-large> mdi-plus </v-icon>
        </v-chip>
      </v-container>
    </v-card-text>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler.js"

export default {
  name: "SettingsAppearance",
  data() {
    return {
      defineAccent: false,
      accent: null,
      css: "",
      autoCSS: false,
      fonts: [
        "Inter",
        "Roboto",
        "JetBrains Mono",
        "Montserrat",
        "Ubuntu",
        "Inconsolata",
        "Comfortaa",
        "Comic Neue",
        "Open Sans"
      ],
      creator: {
        id: 1,
        name: "",
        json: {},
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
      },
      createTheme: false,
      createThemeCSS: false,
      name: "",
      creatorType: "create",
      themes: []
    }
  },
  computed: {
    creatorJSON: {
      get() {
        return JSON.stringify(this.creator)
      },
      set(value) {
        this.creator = JSON.parse(value)
      }
    },
    computeThemes() {
      let array = []
      if (this.$vuetify.theme.dark) {
        array = this.themes.filter(
          (theme) => theme.primaryType === "dark" || theme.primaryType === "all"
        )
        return array
      } else {
        array = this.themes.filter(
          (theme) =>
            theme.primaryType === "light" || theme.primaryType === "all"
        )
        return array
      }
    }
  },
  watch: {
    "$store.state.themeEngine.editor"() {
      this.getThemes()
    },
    "$store.state.themeEngine.cssEditor"() {
      this.getThemes()
    },
    "creator.css"() {
      if (this.autoCSS) {
        this.applyCSS(null)
      }
    },
    creator() {
      this.$vuetify.theme.themes.dark = this.creator.dark
      this.$vuetify.theme.themes.light = this.creator.light
      this.$vuetify.theme.themes.name = this.creator.id
    },
    accent() {
      this.setTheme(
        this.themes.find(
          (theme) => theme.id === this.$vuetify.theme.themes.name
        )
      )
    },
    defineAccent() {
      if (!this.defineAccent) {
        this.accent = null
        this.$store.state.user.accentColor = null
        this.getThemes()
      } else {
        this.accent = this.$store.state.user.accentColor || "#0190ea"
      }
    },
    "$store.state.user.theme": {
      handler() {
        this.$vuetify.theme.dark = this.$store.state.user.theme === "dark"
      },
      deep: true
    }
  },
  mounted() {
    this.defineAccent = this.$store.state.user.accentColor !== null
    this.accent = this.$store.state.user.accentColor
    this.name = this.$vuetify.theme.themes.name
    this.getThemes()
  },
  methods: {
    setFont() {
      const element = document.getElementById("user-font")
      if (element) {
        element.parentNode.removeChild(element)
      }
      const style = document.createElement("style")
      style.id = "user-font"
      style.innerHTML = `/* Stop from font breaking CSS code editor */
.ace_editor div {
 font-family: "JetBrains Mono" !important;
}

div {
 font-family: "${this.$store.state.user.font}", sans-serif;
}
`
      document.head.appendChild(style)
      this.$store.dispatch("saveOnlineSettings")
    },
    editorInit() {
      require("brace/ext/language_tools")
      require("brace/mode/css")
      require("brace/mode/less")
      require("brace/theme/monokai")
      require("brace/theme/chrome")
      require("brace/snippets/css")
    },
    randomizeTheme() {
      this.creator.light = {
        primary: "#" + Math.floor(Math.random() * 16777215).toString(16),
        secondary: "#" + Math.floor(Math.random() * 16777215).toString(16),
        accent: "#" + Math.floor(Math.random() * 16777215).toString(16),
        error: "#" + Math.floor(Math.random() * 16777215).toString(16),
        info: "#" + Math.floor(Math.random() * 16777215).toString(16),
        success: "#" + Math.floor(Math.random() * 16777215).toString(16),
        warning: "#" + Math.floor(Math.random() * 16777215).toString(16),
        card: "#" + Math.floor(Math.random() * 16777215).toString(16),
        toolbar: "#" + Math.floor(Math.random() * 16777215).toString(16),
        sheet: "#" + Math.floor(Math.random() * 16777215).toString(16),
        text: "#" + Math.floor(Math.random() * 16777215).toString(16),
        dark: "#" + Math.floor(Math.random() * 16777215).toString(16),
        bg: "#" + Math.floor(Math.random() * 16777215).toString(16)
      }
      this.creator.dark = {
        primary: "#" + Math.floor(Math.random() * 16777215).toString(16),
        secondary: "#" + Math.floor(Math.random() * 16777215).toString(16),
        accent: "#" + Math.floor(Math.random() * 16777215).toString(16),
        error: "#" + Math.floor(Math.random() * 16777215).toString(16),
        info: "#" + Math.floor(Math.random() * 16777215).toString(16),
        success: "#" + Math.floor(Math.random() * 16777215).toString(16),
        warning: "#" + Math.floor(Math.random() * 16777215).toString(16),
        card: "#" + Math.floor(Math.random() * 16777215).toString(16),
        toolbar: "#" + Math.floor(Math.random() * 16777215).toString(16),
        sheet: "#" + Math.floor(Math.random() * 16777215).toString(16),
        text: "#" + Math.floor(Math.random() * 16777215).toString(16),
        dark: "#" + Math.floor(Math.random() * 16777215).toString(16),
        bg: "#" + Math.floor(Math.random() * 16777215).toString(16)
      }
    },
    doDeleteTheme(theme) {
      this.axios
        .delete("/api/v1/themes/" + theme.id)
        .then(() => {
          this.$store.dispatch("getUserInfo")
          this.getThemes()
        })
        .catch((e) => {
          AjaxErrorHandler(e)
        })
    },
    getThemes() {
      this.axios.get("/api/v1/themes").then((res) => {
        this.themes = res.data.map((theme) => {
          return {
            id: theme.id,
            name: theme.name,
            primaryType: theme.theme.primaryType,
            dark: theme.theme.dark,
            light: theme.theme.light,
            public: theme.public,
            user: theme.user,
            userId: theme.userId,
            css: theme.theme.css
          }
        })
        this.setTheme(
          this.themes.find(
            (theme) => theme.id === this.$vuetify.theme.themes.name
          )
        )
      })
    },
    doCreateTheme(type, theme) {
      if (this.creatorType === "create" || type === "copy") {
        this.axios
          .post("/api/v1/themes", {
            name:
              type === "copy"
                ? theme?.name + " - Copy" || this.creator.name + " - Copy"
                : this.creator.name,
            theme: theme || this.creator
          })
          .then(() => {
            this.getThemes()
            this.createTheme = false
          })
          .catch((e) => {
            AjaxErrorHandler(this.$store)(e)
          })
      } else {
        this.axios
          .put("/api/v1/themes/" + this.creator.id, {
            name: this.creator.name,
            theme: this.creator
          })
          .then(() => {
            this.getThemes()
            this.createTheme = false
          })
          .catch((e) => {
            AjaxErrorHandler(this.$store)(e)
          })
      }
    },
    initEditTheme(theme) {
      this.creator = theme
      this.$store.commit("setThemeEngineTheme", theme)
      this.$store.commit("setThemeEngineType", "edit")
      this.$store.commit("setThemeEngineEditor", true)
    },
    initThemeCreator() {
      this.$store.dispatch("discardTheme")
      this.$store.state.themeEngine.editor = true
    },
    download(theme) {
      const data = JSON.stringify(theme)
      const blob = new Blob([data], { type: "text/plain" })
      const e = document.createEvent("MouseEvents"),
        a = document.createElement("a")
      a.download = theme.name + " - Colubrina Theme.json"
      a.href = window.URL.createObjectURL(blob)
      a.dataset.downloadurl = ["text/json", a.download, a.href].join(":")
      e.initEvent(
        "click",
        true,
        false,
        window,
        0,
        0,
        0,
        0,
        0,
        false,
        false,
        false,
        false,
        0,
        null
      )
      a.dispatchEvent(e)
    },
    friendlyName(index) {
      if (index === "bg") {
        return "Background"
      } else if (index === "dark") {
        return "Sidebar & Header"
      } else {
        return index.charAt(0).toUpperCase() + index.slice(1)
      }
    },
    setTheme(theme) {
      const name = theme.id
      const dark = theme.dark
      const light = theme.light
      this.$vuetify.theme.themes.dark = dark
      this.$vuetify.theme.themes.light = light
      this.$vuetify.theme.themes.name = name
      this.$vuetify.theme.themes.primaryType = theme.primaryType
      if (this.accent && this.defineAccent) {
        this.$vuetify.theme.themes.light.primary = this.accent
        this.$vuetify.theme.themes.dark.primary = this.accent
        this.$store.state.user.accentColor = this.accent
      } else {
        this.$store.state.user.accentColor = null
      }
      this.name = name
      this.applyCSS(theme)
      this.axios
        .put("/api/v1/user/settings/theme", {
          id: name,
          accent: this.defineAccent ? this.accent : null
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    applyCSS(theme) {
      if (!theme) {
        const element = document.getElementById("user-theme")
        if (element) {
          element.parentNode.removeChild(element)
        }
        const style = document.createElement("style")
        style.id = "user-theme"
        style.innerHTML = this.creator.css
        document.head.appendChild(style)
      } else {
        const element = document.getElementById("user-theme")
        if (element) {
          element.parentNode.removeChild(element)
        }
        const style = document.createElement("style")
        style.id = "user-theme"
        style.innerHTML = theme.css
        document.head.appendChild(style)
      }
    },
    saveSettings() {
      this.loading = true
      this.$vuetify.theme.dark = this.$store.state.user.theme === "dark"

      this.$store
        .dispatch("saveOnlineSettings")
        .then(() => {
          this.loading = false
        })
        .catch((e) => {
          this.loading = false
          AjaxErrorHandler(this.$store)(e)
        })
    }
  }
}
</script>
