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
          broadcastType: this.broadcastType
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
  }
}
</script>

<style scoped></style>
