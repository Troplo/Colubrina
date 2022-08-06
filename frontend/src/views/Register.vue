<template>
  <div id="login" v-if="!$store.state.user?.id">
    <v-dialog v-model="rulesDialog" max-width="700px">
      <v-card color="card">
        <v-toolbar color="toolbar">
          <v-toolbar-title>
            {{ $store.state.site.name }} Rules
          </v-toolbar-title>
        </v-toolbar>
        <v-card-text class="mt-3" style="color: unset">
          <span v-markdown :key="$store.state.site.rules">{{
            $store.state.site.rules
          }}</span>
        </v-card-text>
      </v-card>
    </v-dialog>
    <div :class="{ outer: !$vuetify.breakpoint.mobile }">
      <div :class="{ middle: !$vuetify.breakpoint.mobile }">
        <div :class="{ innerLogin: !$vuetify.breakpoint.mobile }">
          <v-card color="card" class="rounded-xl" elevation="7" width="700">
            <v-container>
              <v-form ref="form" class="pa-4 pt-6">
                <p class="text-center text-h4">
                  Register to
                  <span class="troplo-title">{{ $store.state.site.name }}</span>
                </p>
                <v-text-field
                  @keyup.enter="doRegister()"
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
                  @keyup.enter="doRegister()"
                  class="rounded-xl"
                  v-model="username"
                  label="Username"
                  placeholder="FOO1000"
                  type="email"
                ></v-text-field>
                <v-text-field
                  @keyup.enter="doRegister()"
                  class="rounded-xl"
                  v-model="email"
                  label="Email"
                  placeholder="troplo@troplo.com"
                  type="email"
                ></v-text-field>
                <v-text-field
                  @keyup.enter="doRegister()"
                  class="rounded-xl"
                  v-model="password"
                  color="blue accent-7"
                  label="Password"
                  type="password"
                ></v-text-field>
                <small v-if="$store.state.site.emailVerification"
                  >This instance has email verification enforced, ensure your
                  email is correct.</small
                >
                <v-row align="center">
                  <v-tooltip top v-if="!rulesOpenedOnce">
                    <template v-slot:activator="{ on }">
                      <div v-on="on">
                        <v-switch
                          class="ml-4 mt-5"
                          inset
                          v-model="rules"
                          :disabled="!rulesOpenedOnce"
                        ></v-switch>
                      </div>
                    </template>
                    <span>You need to view the rules first.</span>
                  </v-tooltip>
                  <v-switch
                    class="ml-4 mt-5"
                    inset
                    v-model="rules"
                    v-else
                    :disabled="!rulesOpenedOnce"
                  ></v-switch>
                  I have read and agree to the&nbsp;
                  <a
                    @click="
                      rulesDialog = true
                      rulesOpenedOnce = true
                    "
                    target="_blank"
                  >
                    instance rules </a
                  >.
                </v-row>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    class="rounded-xl"
                    :loading="loading"
                    color="primary"
                    text
                    @click="$router.push('/login')"
                  >
                    Login
                  </v-btn>
                  <v-btn
                    class="rounded-xl"
                    :loading="loading"
                    color="primary"
                    text
                    @click="doRegister()"
                  >
                    Register
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
      username: "",
      password: "",
      email: "",
      totp: "",
      totpDialog: false,
      loading: false,
      rules: false,
      rulesDialog: false,
      rulesOpenedOnce: false,
      instance:
        localStorage.getItem("instance") || "https://colubrina.troplo.com",
      instanceString: ""
    }
  },
  methods: {
    isElectron() {
      return process.env.IS_ELECTRON
    },
    testInstance() {
      if (this.isElectron()) {
        this.axios
          .get(this.instance + "/api/v1/state")
          .then((res) => {
            this.instanceString = res.data.name + " v" + res.data.latestVersion
            this.axios.defaults.baseURL = this.instance
            this.$store.dispatch("getState")
          })
          .catch(() => {
            this.instanceString = "Error connecting to instance"
          })
      }
    },
    viewport() {
      return window.innerHeight
    },
    doRegister() {
      if (!this.rules) {
        this.$toast.error(
          "You need to accept the rules before you can register."
        )
        return
      }
      this.loading = true
      this.axios
        .post("/api/v1/user/register", {
          password: this.password,
          username: this.username,
          email: this.email,
          totp: this.totp
        })
        .then(async (res) => {
          const session =
            res.data.session ||
            res.data.token ||
            res.data.bcToken ||
            res.data.cookieToken
          localStorage.setItem("token", session)
          Vue.axios.defaults.headers.common["Authorization"] = session
          this.$store.commit("setToken", session)
          await this.$store.dispatch("getUserInfo")
          this.$store.dispatch("getChats")
          this.loading = false
          this.$socket.auth.token = session
          this.$socket.disconnect()
          this.$socket.connect()
          if (this.isElectron()) {
            this.axios.defaults.baseURL = this.instance
            localStorage.setItem("instance", this.instance)
          }
          if (
            this.$store.state.site.emailVerification &&
            !this.$store.state.user.emailVerified
          ) {
            this.$router.push("/email/verify")
          } else {
            this.$router.push("/")
          }
          if (this.isElectron()) {
            window.location.reload()
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
    }
  },
  mounted() {
    this.$store
      .dispatch("getUserInfo")
      .then(() => {
        this.$router.push("/")
      })
      .catch(() => {
        this.$store.state.user = {
          bcUser: null,
          loggedIn: false
        }
      })
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
