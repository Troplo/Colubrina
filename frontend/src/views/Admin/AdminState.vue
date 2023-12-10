<template>
  <div>
    <v-toolbar color="toolbar">
      <v-toolbar-title>Site Config</v-toolbar-title>
    </v-toolbar>
    <v-text-field v-model="notification" class="mx-3" label="Notification" />
    <v-select
      v-model="notificationType"
      :items="notificationTypes"
      label="Notification Type"
      class="mx-3"
      text-text="text"
      text-value="value"
    />
    <v-select
      v-model="broadcastType"
      :items="broadcastTypes"
      label="Broadcast Type"
      class="mx-3"
      text-text="text"
      text-value="value"
    />
    <v-switch
      v-model="allowRegistrations"
      inset
      class="mx-3"
      label="Allow registrations"
    />
    <v-textarea
      ref="rules"
      v-model="rules"
      label="Instance Rules"
      class="mx-3"
    />
    <v-card-title>
      <v-icon class="mr-1"> mdi-language-markdown </v-icon>Rules Preview:
    </v-card-title>
    <v-card-text>
      <span :key="rules" v-markdown class="mx-3">{{ rules }}</span>
    </v-card-text>
    <v-btn text class="mx-3 mb-3" color="primary" @click="updateState">
      Save
    </v-btn>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler.js"
export default {
  name: "AdminState",
  data() {
    return {
      notification: "",
      notificationType: "info",
      allowRegistrations: true,
      rules: "",
      notificationTypes: [
        { text: "Info", value: "info" },
        { text: "Success", value: "success" },
        { text: "Error", value: "error" },
        { text: "Warning", value: "warning" }
      ],
      broadcastType: "permanent",
      broadcastTypes: [
        {
          text: "Broadcast",
          value: "broadcast"
        },
        {
          text: "Permanent & Broadcast",
          value: "permanent"
        }
      ]
    }
  },
  mounted() {
    this.notification = this.$store.state.site.notification
    this.notificationType = this.$store.state.site.notificationType
    this.allowRegistrations = this.$store.state.site.allowRegistrations
    this.rules = this.$store.state.site.rules
  },
  methods: {
    updateState() {
      this.axios
        .put("/api/v1/admin/state", {
          notification: this.notification,
          notificationType: this.notificationType,
          broadcastType: this.broadcastType,
          allowRegistrations: this.allowRegistrations,
          rules: this.rules
        })
        .then(() => {
          this.$toast.success("State updated")
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    }
  }
}
</script>

<style scoped></style>
