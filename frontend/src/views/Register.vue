<template>
  <div id="login" v-if="!$store.state.user?.bcUser?.id">
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
      loading: false
    }
  },
  methods: {
    viewport() {
      return window.innerHeight
    },
    doRegister() {
      this.loading = true
      this.axios
        .post("/api/v1/user/register", {
          password: this.password,
          username: this.username,
          email: this.email,
          totp: this.totp
        })
        .then(async (res) => {
          localStorage.setItem("session", res.data.session)
          Vue.axios.defaults.headers.common["Authorization"] = res.data.session
          this.$store.commit("setToken", res.data.session)
          await this.$store.dispatch("getUserInfo")
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
    }
  },
  mounted() {
    if (this.$store.state.user?.id) {
      this.$router.push("/")
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
