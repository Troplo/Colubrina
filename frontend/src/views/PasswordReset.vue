<template>
  <div id="password-reset">
    <v-container>
      <v-card class="rounded-xl">
        <v-card-title class="rounded-xl">
          <h1 class="display-1">Reset your Password</h1>
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field
              @keyup.enter="doPasswordReset()"
              class="rounded-xl"
              v-model="password"
              label="Password"
              type="password"
            ></v-text-field>
            <v-text-field
              @keyup.enter="doPasswordReset()"
              class="rounded-xl"
              v-model="confirmPassword"
              label="Confirm Password"
              type="password"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            class="rounded-xl"
            :loading="loading"
            color="primary"
            text
            @click="doPasswordReset()"
          >
            Reset Password
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler"

export default {
  name: "PasswordReset",
  data() {
    return {
      password: "",
      confirmPassword: "",
      loading: false
    }
  },
  methods: {
    doPasswordReset() {
      if (this.password !== this.confirmPassword) {
        this.$toast.error("Passwords do not match")
        return
      }
      this.loading = true
      this.axios
        .put("/api/v1/user/reset", {
          password: this.password,
          token: this.$route.params.code
        })
        .then(() => {
          this.$router.push("/login")
          this.$toast.success("Password reset successfully")
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
