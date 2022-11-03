<template>
  <div id="settings-security">
    <v-card-text>
      <v-alert>
        <template v-if="totp.stage === 1">
          <p class="text-h6">Enable 2 Factor Authentication</p>
          <p>
            2 Factor Authentication is a security feature that will require you
            to enter a 6 digit code from your chosen authenticator app such as
            Authy, Bitwarden, or Google Authenticator on login.
            <br />
            Ensure that your authenticator app is safely secured, cannot be
            accessed by anyone else, and that you don't loose it.
          </p>
          <v-text-field
            type="password"
            label="Password"
            v-model="totp.password"
            color="white"
            @keydown.enter="totpEnable"
            autocomplete="false"
          >
          </v-text-field>
          <v-btn @click="totpEnable" text>Proceed</v-btn>
        </template>
        <template v-else-if="totp.stage === 2">
          <p class="text-h6">Enable 2 Factor Authentication</p>
          <p>Your 2FA secret is:</p>
          <code>{{ totp.secret }}</code>
          <p>Please enter the 6 digit code from your authenticator app.</p>
          <v-text-field
            type="number"
            label="Code"
            v-model="totp.code"
            @keydown.enter="totpConfirm"
            color="white"
          >
          </v-text-field>
          <v-btn @click="totpConfirm" text>Enable</v-btn>
        </template>
        <template v-else-if="totp.stage === 3">
          <p class="text-h6">2 Factor Authentication Enabled</p>
          <p>You have successfully enabled 2 Factor Authentication.</p>
          <v-text-field
            type="password"
            label="2FA Code"
            v-model="totp.code"
            color="white"
            @keydown.enter="totpDisable"
          >
          </v-text-field>
          <v-btn @click="totpDisable" text>Disable</v-btn>
        </template>
      </v-alert>
      <v-alert>
        <v-row>
          <v-col>
            <p class="text-h6">Change Password</p>
            <p>You may set a custom password here.</p>
            <v-text-field
              label="Current Password"
              v-model="password.current"
              type="password"
              color="white"
              @keydown.enter="passwordChange"
            ></v-text-field>
            <v-text-field
              label="New Password"
              v-model="password.new"
              type="password"
              color="white"
              :rules="[
                (v) => !!v || 'Current password is required.',
                (v) =>
                  v.length >= 8 || 'Password must be at least 8 characters.'
              ]"
              @keydown.enter="passwordChange"
            ></v-text-field>
            <v-text-field
              label="Confirm New Password"
              v-model="password.confirm"
              type="password"
              color="white"
              :rules="[
                (v) => !!v || 'Current password is required.',
                (v) =>
                  v.length >= 8 || 'Password must be at least 8 characters.'
              ]"
              @keydown.enter="passwordChange"
            ></v-text-field>
            <v-btn @click="passwordChange" text>Change</v-btn>
          </v-col>
        </v-row>
      </v-alert>
    </v-card-text>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler.js"

export default {
  name: "SettingsSecurity",
  data() {
    return {
      password: {
        current: "",
        new: "",
        confirm: "",
        loading: false
      },
      totp: {
        secret: "",
        code: "",
        dialog: false,
        dialogType: "enable",
        loading: false,
        enabled: false,
        password: "",
        stage: 1
      }
    }
  },
  methods: {
    passwordChange() {
      if (this.password.new === this.password.confirm) {
        this.password.loading = true
        this.axios
          .put("/api/v1/user/settings/password", {
            current: this.password.current,
            new: this.password.new
          })
          .then(() => {
            this.password.loading = false
            this.password.current = ""
            this.password.new = ""
            this.password.confirm = ""
            this.$toast.success("Password changed successfully.")
          })
          .catch((e) => {
            this.password.loading = false
            AjaxErrorHandler(this.$store)(e)
          })
      } else {
        this.$toast.error("Passwords do not match.")
      }
    },
    bcSessionsEnable() {},
    totpEnable() {
      this.axios
        .put("/api/v1/user/settings/totp", {
          password: this.totp.password,
          username: this.$store.state.user.username
        })
        .then((res) => {
          this.totp.secret = res.data.secret
          this.totp.stage = 2
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    totpDisable() {
      this.axios
        .put("/api/v1/user/settings/totp", {
          code: this.totp.code,
          username: this.$store.state.user.username
        })
        .then(() => {
          this.totp.stage = 1
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    totpConfirm() {
      this.axios
        .put("/api/v1/user/settings/totpConfirm", {
          code: this.totp.code,
          schoolId: this.$store.state.school.id,
          username: this.$store.state.user.username
        })
        .then(() => {
          this.totp.stage = 3
          this.$store.dispatch("getUserInfo")
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    }
  },
  mounted() {
    this.$store.state.user.totpEnabled
      ? (this.totp.stage = 3)
      : (this.totp.stage = 1)
  }
}
</script>

<style scoped></style>
