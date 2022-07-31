<template>
  <v-app
    :style="
      'background-color: ' +
      $vuetify.theme.themes[$vuetify.theme.dark ? 'dark' : 'light'].bg
    "
  >
    <v-overlay :value="$store.state.site.loading">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
    <!-- theme engine editors -->
    <vue-final-modal
      v-model="$store.state.themeEngine.editor"
      classes="modal-container"
      content-class="modal-content"
      :drag="true"
      :hide-overlay="true"
      :resize="false"
      :click-to-close="false"
      drag-selector=".editor__toolbar"
      :prevent-click="true"
      :lock-scroll="true"
    >
      <v-card
        color="card lighten-1"
        class="rounded-xl"
        elevation="12"
        max-width="900px"
        max-height="700px"
      >
        <v-card-title color="toolbar" class="editor__toolbar v-toolbar">
          <v-toolbar-title>
            Theme
            {{
              $store.state.themeEngine.type === "create" ? "Creator" : "Editor"
            }}
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <span v-on="on" v-bind="attrs">
                  <v-btn
                    fab
                    small
                    text
                    @click="$store.dispatch('randomizeTheme')"
                  >
                    <v-icon>mdi-dice-multiple</v-icon>
                  </v-btn>
                </span>
              </template>
              <span> Randomize theme </span>
            </v-tooltip>
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="$store.state.themeEngine.editor = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-container>
          <v-alert type="info" text>
            You can now view your changes in real time by navigating anywhere
            throughout {{ $store.state.site.name }} with the editor open.
          </v-alert>
          <v-card-actions>
            <v-btn
              color="primary"
              text
              @click="
                $store.dispatch('saveTheme', { theme: null, type: null })
                $store.state.themeEngine.editor = false
              "
              >{{
                $store.state.themeEngine.type === "create"
                  ? "Create & Apply"
                  : "Save Edits"
              }}</v-btn
            >
            <v-btn
              color="primary"
              text
              @click="
                $store.dispatch('saveTheme', { theme: null, type: 'copy' })
              "
              v-if="$store.state.themeEngine.type === 'edit'"
              >Save a Copy</v-btn
            >
            <v-btn
              color="error darken-1"
              text
              @click="$store.dispatch('discardTheme')"
              >Discard</v-btn
            >
          </v-card-actions>
          <v-form>
            <v-text-field
              v-model="$store.state.themeEngine.theme.name"
              class="mx-3"
              label="Theme Name"
              required
            ></v-text-field>
            <v-select
              :items="intendedFor"
              label="Intended for"
              class="mx-3"
              v-model="$store.state.themeEngine.theme.primaryType"
            >
            </v-select>
            <v-text-field
              v-model="creatorJSON"
              label="JSON"
              class="mx-3"
            ></v-text-field>
            <v-btn @click="$store.state.themeEngine.cssEditor = true">
              Custom CSS
            </v-btn>
            <h2
              class="ml-2 mt-2 mb-3"
              v-if="
                $store.state.themeEngine.theme.primaryType === 'dark' ||
                $store.state.themeEngine.theme.primaryType === 'all'
              "
            >
              Dark:
            </h2>
            <v-row
              v-if="
                $store.state.themeEngine.theme.primaryType === 'dark' ||
                $store.state.themeEngine.theme.primaryType === 'all'
              "
            >
              <v-col
                sm="3"
                v-for="(item, index) in $store.state.themeEngine.theme.dark"
                :key="index + '-dark-card'"
              >
                <v-card color="card">
                  <h3 class="ml-2 mt-2 mb-2">
                    {{ friendlyName(index) }}
                  </h3>
                  <v-menu offset-y>
                    <template v-slot:activator="{ on }">
                      <v-card
                        class="mb-2 mx-2"
                        :color="$store.state.themeEngine.theme.dark[index]"
                        v-on="on"
                      >
                        <v-container></v-container>
                      </v-card>
                    </template>
                    <v-color-picker
                      v-model="$store.state.themeEngine.theme.dark[index]"
                      show-swatches
                      hide-inputs
                    ></v-color-picker>
                  </v-menu>
                  <v-text-field
                    class="mx-2"
                    label="#HEX"
                    v-model="$store.state.themeEngine.theme.dark[index]"
                  ></v-text-field>
                </v-card>
              </v-col>
            </v-row>
            <h2
              class="ml-2 mt-2 mb-3"
              v-if="
                $store.state.themeEngine.theme.primaryType === 'light' ||
                $store.state.themeEngine.theme.primaryType === 'all'
              "
            >
              Light:
            </h2>
            <v-row
              v-if="
                $store.state.themeEngine.theme.primaryType === 'light' ||
                $store.state.themeEngine.theme.primaryType === 'all'
              "
            >
              <v-col
                sm="3"
                v-for="(item, index) in $store.state.themeEngine.theme.light"
                :key="index + '-light-card'"
              >
                <v-card color="card">
                  <h3 class="ml-2 mt-2 mb-2">
                    {{ friendlyName(index) }}
                  </h3>
                  <v-menu offset-y>
                    <template v-slot:activator="{ on }">
                      <v-card
                        class="mb-2 mx-2"
                        :color="$store.state.themeEngine.theme.light[index]"
                        v-on="on"
                      >
                        <v-container></v-container>
                      </v-card>
                    </template>
                    <v-color-picker
                      v-model="$store.state.themeEngine.theme.light[index]"
                      show-swatches
                      hide-inputs
                    ></v-color-picker>
                  </v-menu>
                  <v-text-field
                    class="mx-2"
                    label="#HEX"
                    v-model="$store.state.themeEngine.theme.light[index]"
                  ></v-text-field>
                </v-card>
              </v-col>
            </v-row>
          </v-form>
          <v-card-actions>
            <v-btn
              color="primary"
              text
              @click="
                $store.dispatch('saveTheme', { theme: null, type: null })
                $store.state.themeEngine.editor = false
              "
              >{{
                $store.state.themeEngine.type === "create"
                  ? "Create & Apply"
                  : "Save Edits"
              }}</v-btn
            >
            <v-btn
              color="primary"
              text
              @click="
                $store.dispatch('saveTheme', { theme: null, type: 'copy' })
              "
              v-if="$store.state.themeEngine.type === 'edit'"
              >Save a Copy</v-btn
            >
            <v-btn
              color="error darken-1"
              text
              @click="$store.dispatch('discardTheme')"
              >Discard</v-btn
            >
          </v-card-actions>
        </v-container>
      </v-card>
    </vue-final-modal>
    <vue-final-modal
      ref="editor-modal"
      v-model="$store.state.themeEngine.cssEditor"
      classes="modal-container"
      content-class="modal-content"
      :drag="true"
      :hide-overlay="true"
      :resize="true"
      :resize-directions="['r', 'l']"
      :min-width="400"
      :focus-retain="true"
      :click-to-close="false"
      drag-selector=".editor__toolbar"
      :prevent-click="true"
      :lock-scroll="false"
    >
      <v-card
        min-width="100%"
        color="card lighten-1"
        class="rounded-xl"
        elevation="7"
        style="border-radius: 0; padding: 0"
      >
        <v-card-title color="toolbar" class="editor__toolbar v-toolbar">
          <v-toolbar-title>CSS Editor</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="$store.state.themeEngine.cssEditor = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-container>
          <v-row>
            <v-col>
              <v-alert type="info" text class="editor__toolbar">
                CTRL + ALT + D / F9 will toggle all custom CSS styling, works
                anywhere, even outside the editor.</v-alert
              >
              <v-switch
                inset
                label="Live update"
                v-model="$store.state.themeEngine.autoCSS"
              ></v-switch>
              <v-btn
                icon
                class="mb-2"
                @click="
                  $store.dispatch('saveTheme', { theme: null, type: null })
                  $store.dispatch('applyCSS', null)
                "
              >
                <v-icon>mdi-content-save</v-icon>
              </v-btn>
              <v-btn
                icon
                class="mb-2"
                @click="$store.dispatch('applyCSS', null)"
              >
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
              <editor
                class="editor"
                v-model="$store.state.themeEngine.theme.css"
                @init="editorInit"
                lang="css"
                :theme="$vuetify.theme.dark ? 'monokai' : 'chrome'"
                height="350"
              ></editor>
            </v-col>
            <v-col v-if="cssTips">
              <v-card-title>
                Tips
                <v-spacer></v-spacer>
                <v-btn icon @click="cssTips = false">
                  <v-icon>mdi-close</v-icon>
                </v-btn></v-card-title
              >
              <v-alert type="error" text>
                This is an alert.<br />
                Try to style it with .v-alert</v-alert
              >
              Here's an example:<br />
              <code class="block"
                >.v-alert {<br />
                background-color: blue !important; <br />}
              </code>
              <v-btn
                class="mt-2 mr-2"
                @click="$toast.success('I have been pressed.')"
                >Here's a button</v-btn
              >
              <v-btn
                class="mt-2"
                text
                color="info"
                @click="$toast.info('This is the second button\'s action.')"
                >Here's another one</v-btn
              >
              <v-card-title> Fonts </v-card-title>
              <code
                class="block"
                style="white-space: pre-line; overflow-wrap: anywhere"
              >
                /* Stop from font breaking CSS code editor */<br />
                .ace_editor div {<br />
                &nbsp;font-family: "JetBrains Mono" !important; <br />}<br />
                div {<br />
                &nbsp;font-family: "Inter", sans-serif;
                <br />}
              </code>
              There are little pre-loaded fonts you can use, they include:
              <ul>
                <li>Roboto (Default)</li>
                <li>Inter</li>
                <li>JetBrains Mono</li>
              </ul>
              You may import your own fonts using
              <code>@import</code>, or use system fonts.
            </v-col>
          </v-row>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="blue darken-1"
              text
              @click="
                $store.dispatch('saveTheme', { theme: null, type: null })
                $store.dispatch('applyCSS', null)
                $store.state.themeEngine.cssEditor = false
              "
            >
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-container>
      </v-card>
    </vue-final-modal>
    <!-- end theme engine editors -->
    <v-dialog v-model="$store.state.modals.search" max-width="600px">
      <v-card color="card">
        <v-toolbar color="toolbar">
          <v-toolbar-title>
            {{ $store.state.site.name }} QuickSwitcher
          </v-toolbar-title>
        </v-toolbar>
        <v-container v-if="$store.state.modals.search">
          <v-autocomplete
            @keydown.enter="handleEnter"
            auto-select-first
            v-model="search"
            :items="$store.state.quickSwitchCache"
            item-text="subjectLongName"
            label="Search"
            outlined
            autofocus
            return-object
            :search-input.sync="searchInput"
          >
          </v-autocomplete>
        </v-container>
      </v-card>
    </v-dialog>
    <v-main>
      <Header></Header>
      <v-container
        v-if="
          $store.state.site.latestVersion > $store.state.versioning.version &&
          $store.state.site.release !== 'dev'
        "
        id="update-notify-banner"
      >
        <v-alert class="mx-4 rounded-xl" type="info" text dismissible>
          {{ $store.state.site.name }} just got better. Please CTRL+R / ⌘+R to
          update. (You are on version {{ $store.state.versioning.version }}, and
          the latest version is {{ $store.state.site.latestVersion }})
        </v-alert>
      </v-container>
      <v-container
        v-if="$store.state.site.notification && $store.state.user"
        id="notification-banner"
      >
        <v-alert
          text
          class="mx-4 rounded-xl"
          dismissible
          :type="$store.state.site.notificationType"
        >
          {{ $store.state.site.notification }}
        </v-alert>
      </v-container>
      <v-container v-if="!$store.state.online" id="offline-notify-banner">
        <v-alert text class="mx-4" type="warning">
          You are currently offline. {{ $store.state.site.name }} functionality
          is limited.
        </v-alert>
      </v-container>
      <router-view
        :style="
          'background-color: ' +
          $vuetify.theme.themes[$vuetify.theme.dark ? 'dark' : 'light'].bg
        "
      />
    </v-main>
  </v-app>
</template>
<style></style>
<script>
import AjaxErrorHandler from "@/lib/errorHandler"
import { VueFinalModal } from "vue-final-modal"
import Header from "@/components/Header"
import Vue from "vue"
export default {
  name: "App",
  components: {
    VueFinalModal,
    Header,
    editor: require("vue2-ace-editor")
  },
  data: () => ({
    compactModeNag: true,
    intendedFor: [
      { text: "All base themes", value: "all" },
      { text: "Dark theme", value: "dark" },
      { text: "Light theme", value: "light" }
    ],
    loading: false,
    defineAccent: false,
    accent: "#0179f3",
    loadingGuidedWizard: false,
    guidedWizard: {
      step: 1
    },
    connectionLoading: false,
    update: false,
    search: "",
    results: [],
    searchInput: null,
    themes: [],
    cssTips: true
  }),
  computed: {
    creatorJSON: {
      get() {
        return JSON.stringify(this.$store.state.themeEngine.theme)
      },
      set(value) {
        this.$store.state.themeEngine.theme = JSON.parse(value)
      }
    },
    today() {
      return this.$date().format("YYYY-MM-DD")
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
  methods: {
    handleEnter() {
      if (
        !this.searchInput &&
        this.$store.state.lastRoute &&
        this.$store.state.lastRoute !== this.$route.path
      ) {
        this.$router.push(this.$store.state.lastRoute)
        this.$store.state.modals.search = false
      }
    },
    registerSocket() {
      if (!this.$store.state.wsRegistered) {
        this.$store.state.wsRegistered = true
        this.$store.dispatch("getCommunicationsUnread")
        this.$socket.on("friendAccepted", (message) => {
          this.$notification.show(
            message.user.username,
            {
              body:
                message.user2.username + " has accepted your friend request",
              icon: message.user2.avatar
                ? "/usercontent/" + message.user2.avatar
                : null
            },
            {}
          )
          new Audio(require("@/assets/audio/message.wav")).play()
          this.$toast.success(
            "Friend request accepted by " + message.user2.username
          )
        })
        this.$socket.on("message", (message) => {
          this.$store.state.communicationNotifications += 1
          this.$store.state.chats.find(
            (chat) => chat.id === message.associationId
          ).unread += 1
          if (
            (message.userId !== this.$store.state.user.id &&
              parseInt(this.$route.params?.id) !== message.associationId &&
              this.$store.state.user?.storedStatus !== "busy") ||
            (message.userId !== this.$store.state.user.id &&
              this.$store.state.user?.storedStatus !== "busy" &&
              !document.hasFocus())
          ) {
            if (localStorage.getItem("messageAudio")) {
              if (JSON.parse(localStorage.getItem("messageAudio"))) {
                new Audio(require("@/assets/audio/message.wav")).play()
              }
            } else {
              new Audio(require("@/assets/audio/message.wav")).play()
            }
            this.$notification.show(
              message.user.username + " (" + message.chat.name + ")",
              {
                body: message.content,
                icon: message.user.avatar
                  ? "/usercontent/" + message.user.avatar
                  : null
              },
              {}
            )
            this.$toast.info(
              "Message: " +
                message.content +
                "\n\n" +
                "From: " +
                message.user.username +
                "\n" +
                "Sent in: " +
                message.chat.name,
              {
                toastClassName: "message-toast",
                onClick: () => {
                  this.$router.push("/communications/" + message.associationId)
                }
              }
            )
          }
        })
        if (this.$store.state.user.storedStatus !== "busy") {
          this.$socket.on("friendRequest", (message) => {
            this.$notification.show(
              message.user.username,
              {
                body: message.user.username + " has sent a friend request",
                icon: message.user.avatar
                  ? "/usercontent/" + message.user.avatar
                  : null
              },
              {}
            )
            new Audio(require("@/assets/audio/message.wav")).play()
            this.$toast.info("Friend request sent by " + message.user.username)
          })
        }
        this.$store.commit("setWSConnected", true)
        this.$socket.on("disconnect", () => {
          this.$store.commit("setWSConnected", false)
        })
        this.$socket.on("connect", () => {
          this.$store.commit("setWSConnected", true)
        })
        this.$socket.on("siteState", (state) => {
          this.$store.state.site.latestVersion = state.latestVersion
          this.$store.state.site.notification = state.notification
          this.$store.state.site.notificationType = state.notificationType
        })
        // eslint-disable-next-line no-undef
        this.$store.dispatch("updateQuickSwitch")
      } else {
        console.info("Socket already registered.")
      }
    },
    communicationsIdleCheck() {
      let time
      let idle = false
      window.onload = resetTimer
      document.onmousemove = resetTimer
      document.onkeydown = resetTimer
      document.onmousedown = resetTimer
      let self = this
      function setIdle() {
        if (!idle) {
          self.$socket.emit("idle")
          idle = true
          console.log("idle")
        } else {
          self.$socket.emit("online")
          idle = false
          console.log("online")
        }
      }

      function resetTimer() {
        clearTimeout(time)
        if (idle) {
          setIdle()
        }
        time = setTimeout(
          function () {
            setIdle()
          }.bind(this.$socket),
          300000
        )
      }
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
    editorInit() {
      require("brace/ext/language_tools")
      require("brace/mode/css")
      require("brace/mode/less")
      require("brace/theme/monokai")
      require("brace/theme/chrome")
      require("brace/snippets/css")
    },
    saveSettings() {
      this.loading = true
      this.$vuetify.theme.dark = this.$store.state.user?.theme === "dark"
      this.$store
        .dispatch("saveOnlineSettings")
        .then(() => {
          this.loading = false
        })
        .catch((e) => {
          this.loading = false
          AjaxErrorHandler(this.$store)(e)
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
            userId: theme.userId
          }
        })
      })
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
      this.axios
        .put("/api/v1/user/settings/theme", {
          id: name,
          accent: this.defineAccent ? this.accent : null
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    }
  },
  mounted() {
    Vue.axios.defaults.headers.common["X-Colubrina"] = true
    Vue.axios.defaults.headers.common["Authorization"] =
      localStorage.getItem("session")
    console.log(localStorage.getItem("instance"))
    if (process.env.IS_ELECTRON) {
      this.axios.defaults.baseURL = localStorage.getItem("instance")
      this.$store.state.baseURL = localStorage.getItem("instance")
    }
    if (localStorage.getItem("customHeaders")) {
      console.log(JSON.parse(localStorage.getItem("customHeaders")))
      for (let header in JSON.parse(localStorage.getItem("customHeaders"))) {
        Vue.axios.defaults.headers[header] = JSON.parse(
          localStorage.getItem("customHeaders")
        )[header]
      }
    }
    if (this.$vuetify.breakpoint.mobile) {
      this.$store.state.drawer = false
    }
    if (localStorage.getItem("cssTipsDismissed")) {
      this.cssTips = false
    }
    if (localStorage.getItem("userPanel")) {
      this.$store.state.userPanel = JSON.parse(
        localStorage.getItem("userPanel")
      )
    } else {
      this.$store.state.userPanel = true
    }
    if (this.$vuetify.breakpoint.mobile) {
      this.$store.state.userPanel = false
    }
    window.addEventListener("offline", () => {
      this.$store.commit("setOnline", false)
      this.$store.dispatch("getState")
    })
    window.addEventListener("online", () => {
      this.$store.commit("setOnline", true)
      this.$store.dispatch("getState")
      this.$store.dispatch("getUserInfo")
    })
    this.$socket.connect()
    this.$socket.on("unauthorized", () => {
      this.$socket.emit("token", localStorage.getItem("session"))
    })
    document.title = this.$route.name
      ? this.$route.name + " - " + this.$store.state.site.name
      : this.$store.state.site.name || "Colubrina"
    this.$store.commit("setLoading", true)
    this.$vuetify.theme.dark = this.$store.state.user?.theme === "dark" || true
    this.$store.dispatch("getState")
    this.getThemes()
    this.communicationsIdleCheck()
    this.$store
      .dispatch("getUserInfo")
      .then(() => {
        console.log(window.location.pathname)
        // check if its /email/confirm/<token>
        if (
          !window.location.pathname.includes("/email/confirm/") &&
          !window.location.pathname.includes("/email/verify") &&
          !this.$store.state.user.emailVerified &&
          this.$store.state.site.emailVerification
        ) {
          this.$router.push("/email/verify")
        }
      })
      .catch(() => {
        if (!["/login", "/register"].includes(this.$route.path)) {
          this.$router.push("/login")
        }
      })
    this.registerSocket()
  },
  watch: {
    "$store.state.userPanel"(val) {
      localStorage.setItem("userPanel", val)
    },
    cssTips(val) {
      localStorage.setItem("cssTipsDismissed", !val)
    },
    "$store.state.themeEngine.theme": {
      handler() {
        this.$vuetify.theme.themes.dark =
          this.$store.state.themeEngine.theme.dark
        this.$vuetify.theme.themes.light =
          this.$store.state.themeEngine.theme.light
        this.$vuetify.theme.themes.name = this.$store.state.themeEngine.theme.id
      },
      deep: true
    },
    "$store.state.themeEngine.theme.css"() {
      if (this.$store.state.themeEngine.autoCSS) {
        this.$store.dispatch("applyCSS", null)
      }
    },
    "$store.state.user.theme": {
      handler() {
        if (this.$store.state.user?.theme) {
          this.$vuetify.theme.dark = this.$store.state.user.theme === "dark"
        }
      },
      deep: true
    },
    $route(to, from) {
      document.title = to.name + " - " + this.$store.state.site.name
      this.$store.state.lastRoute = from.path
    },
    search() {
      if (this.search) {
        if (this.search.id) {
          this.$router.push("/communications/" + this.search.id)
          this.$store.commit("setSearch", false)
          this.search = null
          this.$nextTick(() => {
            this.searchInput = null
          })
        } else if (this.search.customType === 1) {
          this.$router.push(this.search.route)
          this.$store.commit("setSearch", false)
          this.search = null
          this.$nextTick(() => {
            this.searchInput = null
          })
        }
      }
    }
  }
}
</script>

<style scoped>
::v-deep .modal-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
::v-deep .modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90%;
  margin: 0 1rem;
  padding: 1rem;
  border-radius: 0.25rem;
}
.editor__toolbar {
}
.editor {
  height: 100%;
  width: 100%;
  border-radius: inherit !important;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1) !important;
  padding: 20px !important;
  overflow: hidden !important;
  background: inherit;
  font-family: "JetBrains Mono", monospace !important;
}
.ace_gutter {
  background: inherit !important;
}
.block {
  display: block;
  background: none;
  white-space: pre;
  -webkit-overflow-scrolling: touch;
  overflow-x: scroll;
  max-width: 100%;
  min-width: 100px;
  padding: 0;
}
</style>
