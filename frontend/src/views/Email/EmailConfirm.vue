<template>
  <div>
    <v-container>
      <v-card color="card" class="rounded-xl">
        <v-toolbar color="toolbar">
          <v-toolbar-title> Email Confirmation </v-toolbar-title>
        </v-toolbar>
        <v-container v-if="loading" class="text-center justify-center">
          <v-progress-circular
            size="64"
            :indeterminate="true"
            class="mb-3"
          ></v-progress-circular>
          <h3>We're currently confirming your email address. Please wait.</h3>
        </v-container>
        <v-container v-else-if="failed" class="text-center justify-center">
          <v-icon size="72"> mdi-alert-outline </v-icon>
          <h3>
            We were unable to verify your email address, your code may be
            incorrect, or have expired.
          </h3>
        </v-container>
        <v-container v-else class="text-center justify-center">
          <v-icon size="72"> mdi-check-circle </v-icon>
          <h3>Your email has been verified!</h3>
        </v-container>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler"

export default {
  name: "EmailConfirm",
  data() {
    return {
      failed: false,
      loading: true
    }
  },
  mounted() {
    this.axios
      .post("/api/v1/user/verify/confirm/" + this.$route.params.token)
      .then(() => {
        this.loading = false
        this.$store.dispatch("getUserInfo")
        this.$store.dispatch("getChats")
      })
      .catch((e) => {
        this.loading = false
        this.failed = true
        AjaxErrorHandler(this.$store)(e)
      })
  }
}
</script>

<style scoped></style>
