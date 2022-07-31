<template>
  <div id="login" v-if="!$store.state.user?.bcUser?.id">
    <v-dialog v-model="totpDialog" max-width="500px">
      <v-card color="card">
        <v-toolbar color="toolbar">
          <v-toolbar-title> Two-Factor Authentication </v-toolbar-title>
        </v-toolbar>
        <v-container>
          <v-card-text
            >You are seeing this because you have enabled Two-Factor
            Authentication on {{ $store.state.site.name }}.<br />
            Please check your phone, or authenticator app to obtain the 6 digit
            code and enter it here.</v-card-text
          >
          <v-otp-input
            length="6"
            @keyup.enter="doLogin()"
            @finish="doLogin()"
            v-model="totp"
            :disabled="loading"
          ></v-otp-input>
        </v-container>
      </v-card>
    </v-dialog>
    <div :class="{ outer: !$vuetify.breakpoint.mobile }">
      <div :class="{ middle: !$vuetify.breakpoint.mobile }">
        <div :class="{ innerLogin: !$vuetify.breakpoint.mobile }">
          <v-card color="card" class="rounded-xl" elevation="7" width="700">
            <v-container>
              <v-form ref="form" class="pa-4 pt-6">
                <p class="text-center text-h4">
                  Login to
                  <span class="troplo-title">{{ $store.state.site.name }}</span
                  ><small style="font-size: 15px">beta</small>
                </p>
                <v-text-field
                  @keyup.enter="doLogin()"
                  class="rounded-xl"
                  v-model="instance"
                  v-if="isElectron()"
                  label="Instance URL"
                  placeholder="https://colubrina.troplo.com"
                  type="email"
                ></v-text-field>
                <small style="float: right" v-if="isElectron()">{{
                  instanceString
                }}</small
                ><br v-if="isElectron()" />
                <v-text-field
                  @keyup.enter="doLogin()"
                  class="rounded-xl"
                  v-model="customHeaders[header.name]"
                  v-for="header in $store.state.site.customHeaders"
                  :key="header.name"
                  :label="header.friendlyName"
                  :placeholder="header.placeholder"
                  type="email"
                ></v-text-field>
                <v-text-field
                  @keyup.enter="doLogin()"
                  class="rounded-xl"
                  v-model="username"
                  label="Username"
                  placeholder="FOO1000"
                  type="email"
                ></v-text-field>
                <v-text-field
                  @keyup.enter="doLogin()"
                  class="rounded-xl"
                  v-model="password"
                  color="blue accent-7"
                  label="Password"
                  type="password"
                ></v-text-field>
                <v-switch
                  inset
                  label="Remember Me"
                  v-model="rememberMe"
                ></v-switch>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    class="rounded-xl"
                    :loading="loading"
                    color="primary"
                    text
                    @click="$router.push('/register')"
                    v-if="$store.state.site.allowRegistrations"
                  >
                    Register
                  </v-btn>
                  <v-btn
                    class="rounded-xl"
                    :loading="loading"
                    color="primary"
                    text
                    @click="doLogin()"
                  >
                    Login
                  </v-btn>
                </v-card-actions>
              </v-form>
            </v-container>
          </v-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue"
import AjaxErrorHandler from "@/lib/errorHandler"

export default {
  name: "Login",
  data() {
    return {
      instanceString: "",
      rememberMe: true,
      username: "",
      password: "",
      totp: "",
      totpDialog: false,
      loading: false,
      instance: "https://colubrina.troplo.com",
      customHeaders: {}
    }
  },
  methods: {
    isElectron() {
      return process.env.IS_ELECTRON
    },
    viewport() {
      return window.innerHeight
    },
    doLogin() {
      this.loading = true
      localStorage.setItem("customHeaders", JSON.stringify(this.customHeaders))
      for (let header in this.customHeaders) {
        Vue.axios.defaults.headers[header] = this.customHeaders[header]
      }
      this.axios
        .post("/api/v1/user/login", {
          password: this.password,
          username: this.username,
          rememberMe: this.rememberMe,
          totp: this.totp
        })
        .then(async (res) => {
          const session =
            res.data.session || res.data.bcToken || res.data.cookieToken

          localStorage.setItem("session", session)
          Vue.axios.defaults.headers.common["Authorization"] = session
          this.$store.commit("setToken", session)
          await this.$store.dispatch("getUserInfo")
          this.$store.dispatch("getChats")
          this.loading = false
          this.$socket.disconnect()
          this.$socket.connect()
          if (
            this.$store.state.site.emailVerification &&
            !this.$store.state.user.emailVerified
          ) {
            this.$router.push("/email/verify")
          } else {
            this.$router.push("/")
          }
        })
        .catch((e) => {
          if (
            e?.response?.data?.errors[0]?.name === "invalidTotp" &&
            !this.totpDialog
          ) {
            this.totpDialog = true
            this.loading = false
          } else {
            AjaxErrorHandler(this.$store)(e)
            this.loading = false
          }
        })
    },
    testInstance() {
      if (this.isElectron()) {
        this.axios
          .get(this.instance + "/api/v1/state")
          .then((res) => {
            this.instanceString = res.data.name + " v" + res.data.latestVersion
            this.axios.defaults.baseURL = this.instance
            localStorage.setItem("instance", this.instance)
            this.$store.dispatch("getState")
          })
          .catch(() => {
            this.instanceString = "Error connecting to instance"
          })
      }
    }
  },
  mounted() {
    if (this.$store.state.user?.id) {
      this.$router.push("/")
    }
    this.testInstance()
  },
  watch: {
    instance() {
      this.testInstance()
    }
  }
}
</script>

<style scoped>
.outer {
  display: table;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
}

.middle {
  display: table-cell;
  vertical-align: middle;
}

.innerLogin {
  margin-left: auto;
  margin-right: auto;
  width: 700px;
}
</style>
