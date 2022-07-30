<template>
  <div id="settings-site" v-if="$store.state.user?.id">
    <v-card-text>
      <div class="d-flex">
        <v-btn
          v-if="$store.state.site.release === 'dev'"
          @click="
            $toast.info('Hi', {
              toastClassName: 'message-toast',
              timeout: 100000,
              closeOnClick: false
            })
          "
        >
          Trigger Toast
        </v-btn>
        <v-hover v-slot="{ hover }">
          <v-avatar
            :color="$vuetify.theme.themes.dark.primary"
            size="62"
            @click="handleUpload"
          >
            <v-fade-transition v-if="hover">
              <v-overlay absolute>
                <v-icon large>mdi-upload</v-icon>
              </v-overlay>
            </v-fade-transition>
            <v-img
              :src="'/usercontent/' + $store.state.user.avatar"
              v-if="$store.state.user.avatar"
              class="elevation-1"
            />
            <v-icon v-else-if="!hover" class="elevation-1">
              mdi-account
            </v-icon>
          </v-avatar>
        </v-hover>
        <v-file-input
          class="ml-3"
          ref="avatarUpload"
          accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
          placeholder="Avatar"
          prepend-icon=""
          label="Profile Picture"
          v-model="avatar.file"
          @change="doUpload"
        ></v-file-input>
      </div>
      <v-text-field
        v-model="$store.state.user.email"
        label="Email"
        :rules="[
          (v) => !!v || 'Email is required',
          (v) => /^.+@.+\..+$/.test(v) || 'Email must be valid'
        ]"
      ></v-text-field>
      <v-text-field
        v-model="$store.state.user.username"
        label="Username"
        :rules="[
          (v) => !!v || 'Username is required',
          (v) => v.length <= 12 || 'Username must be less than 12 characters',
          (v) => /^[a-zA-Z0-9]+$/.test(v) || 'Username must be alphanumeric',
          (v) => v.length >= 2 || 'Username must be at least 2 characters'
        ]"
      ></v-text-field>
    </v-card-text>
    <v-card-actions>
      <v-btn
        text
        color="primary"
        @click="
          $store.dispatch('saveOnlineSettings')
          $toast.success('Updated successfully.')
        "
        :disabled="!$store.state.user.email || !$store.state.user.username"
      >
        Save
      </v-btn>
      <v-btn
        color="red"
        text
        @click="
          $store.dispatch('logout')
          $router.push('/login')
        "
        >Logout</v-btn
      >
    </v-card-actions>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler"

export default {
  name: "SettingsSite",
  data() {
    return {
      avatar: {
        file: null,
        loading: false
      },
      loading: false,
      interval: null,
      slider: 300
    }
  },
  computed: {
    debugModeEnabled() {
      if (localStorage.getItem("debugModeEnabled")) {
        return JSON.parse(localStorage.getItem("debugModeEnabled"))
      } else {
        return false
      }
    }
  },
  methods: {
    doUpload() {
      if (this.avatar.file) {
        this.avatar.loading = true
        let formData = new FormData()
        formData.append("avatar", this.avatar.file)
        this.axios
          .post("/api/v1/user/settings/avatar", formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          })
          .then(() => {
            this.$store.dispatch("getUserInfo").then(() => {
              this.avatar.loading = false
            })
          })
          .catch((e) => {
            this.avatar.loading = false
            AjaxErrorHandler(this.$store)(e)
          })
      }
    },
    handleUpload() {
      this.$refs.avatarUpload.$refs.input.click()
    },
    stopColorTheme() {
      clearInterval(this.interval)
    },
    randomColorTheme() {
      clearInterval(this.interval)
      this.interval = setInterval(() => {
        this.$vuetify.theme.themes.light = {
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
          bg: "#" + Math.floor(Math.random() * 16777215).toString(16),
          calendarNormalActivity:
            "#" + Math.floor(Math.random() * 16777215).toString(16),
          calendarActivityType7:
            "#" + Math.floor(Math.random() * 16777215).toString(16),
          calendarActivityType8:
            "#" + Math.floor(Math.random() * 16777215).toString(16),
          calendarActivityType10:
            "#" + Math.floor(Math.random() * 16777215).toString(16),
          calendarExternalActivity: Math.floor(
            Math.random() * 16777215
          ).toString(16)
        }
        this.$vuetify.theme.themes.dark = {
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
          bg: "#" + Math.floor(Math.random() * 16777215).toString(16),
          calendarNormalActivity:
            "#" + Math.floor(Math.random() * 16777215).toString(16),
          calendarActivityType7:
            "#" + Math.floor(Math.random() * 16777215).toString(16),
          calendarActivityType8:
            "#" + Math.floor(Math.random() * 16777215).toString(16),
          calendarActivityType10:
            "#" + Math.floor(Math.random() * 16777215).toString(16),
          calendarExternalActivity: Math.floor(
            Math.random() * 16777215
          ).toString(16)
        }
      }, this.slider)
    },
    saveSettings() {
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
    }
  }
}
</script>

<style scoped></style>
