<template>
  <div>
    <v-toolbar color="toolbar">
      <v-toolbar-title>Site Config</v-toolbar-title>
    </v-toolbar>
    <v-text-field
      class="mx-3"
      label="Notification"
      v-model="notification"
    ></v-text-field>
    <v-select
      :items="notificationTypes"
      label="Notification Type"
      class="mx-3"
      v-model="notificationType"
      text-text="text"
      text-value="value"
    >
    </v-select>
    <v-select
      :items="broadcastTypes"
      label="Broadcast Type"
      class="mx-3"
      v-model="broadcastType"
      text-text="text"
      text-value="value"
    >
    </v-select>
    <v-switch
      inset
      class="mx-3"
      label="Allow registrations"
      v-model="allowRegistrations"
    ></v-switch>
    <v-textarea ref="rules" label="Instance Rules" v-model="rules" class="mx-3">
    </v-textarea>
    <v-card-title>
      <v-icon class="mr-1">mdi-language-markdown</v-icon>Rules Preview:
    </v-card-title>
    <v-card-text>
      <span v-markdown class="mx-3" :key="rules">{{ rules }}</span>
    </v-card-text>
    <v-btn text class="mx-3 mb-3" color="primary" @click="updateState"
      >Save</v-btn
    >
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler"
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
  },
  mounted() {
    this.notification = this.$store.state.site.notification
    this.notificationType = this.$store.state.site.notificationType
    this.allowRegistrations = this.$store.state.site.allowRegistrations
    this.rules = this.$store.state.site.rules
  }
}
</script>

<style scoped></style>
