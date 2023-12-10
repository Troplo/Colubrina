<template>
  <div>
    <v-card-text>
      <v-switch
        v-model="messageAudio"
        inset
        label="Play sound effect on new message"
      />
      <v-switch
        v-model="nativeNotifications"
        inset
        label="Desktop notifications"
        @change="setNativeNotifications"
      />
      <v-btn v-if="nativeNotifications" @click="testNativeNotification">
        Test desktop notifications
      </v-btn>
    </v-card-text>
  </div>
</template>

<script>
export default {
  name: "SettingsCommunications",
  data() {
    return {
      messageAudio: true,
      nativeNotifications: false
    }
  },
  watch: {
    nativeNotifications(val) {
      localStorage.setItem("nativeNotifications", val)
    },
    messageAudio(val) {
      localStorage.setItem("messageAudio", val)
    }
  },
  mounted() {
    if (localStorage.getItem("messageAudio")) {
      this.messageAudio = JSON.parse(localStorage.getItem("messageAudio"))
    }
    if (localStorage.getItem("nativeNotifications")) {
      this.nativeNotifications = JSON.parse(
        localStorage.getItem("nativeNotifications")
      )
    }
  },
  methods: {
    setNativeNotifications() {
      if (this.nativeNotifications) {
        this.$notification.requestPermission().then((res) => {
          if (res === "granted") {
            this.$notification.show(
              this.$store.state.site.name,
              {
                body: "You are testing desktop notifications."
              },
              {}
            )
            this.$toast.success(
              "A desktop notification has been sent, if you don't see it, check your site permissions."
            )
          } else {
            this.$toast.error(
              "You have denied desktop notifications, you will not receive any desktop notifications, this can be changed later in the website permission settings."
            )
          }
        })
        this.$toast.info(
          "Please press Allow on the notification permission dialog to enable notifications."
        )
      }
    },
    testNativeNotification() {
      this.$notification.show(
        this.$store.state.site.name,
        {
          body: "You are testing desktop notifications."
        },
        {}
      )
      this.$toast.success(
        "A desktop notification has been sent, if you don't see it, check your site permissions."
      )
    }
  }
}
</script>

<style scoped></style>
