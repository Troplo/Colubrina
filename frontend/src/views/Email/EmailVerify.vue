<template>
  <div>
    <v-container>
      <v-card color="card" class="rounded-xl">
        <v-toolbar color="toolbar">
          <v-toolbar-title> Email Verification </v-toolbar-title>
        </v-toolbar>
        <v-container>
          <h3>
            Hi, we've sent an email to {{ $store.state.user.email }}, please
            follow the instructions provided.
          </h3>
          <p class="mt-2">Haven't received it?</p>
          <v-btn color="primary" text :loading="loading" @click="resend">
            Resend
          </v-btn>
        </v-container>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler.js"

export default {
  name: "EmailVerify",
  data() {
    return {
      loading: true
    }
  },
  mounted() {
    this.resend()
  },
  methods: {
    resend() {
      this.loading = true
      this.axios
        .post("/api/v1/user/verify/resend")
        .then(() => {
          this.loading = false
          this.$toast.success("Email verification email sent successfully.")
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
