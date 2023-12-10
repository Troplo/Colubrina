<template>
  <v-dialog v-model="nickname.dialog" width="500px">
    <v-card>
      <v-card-title>
        <span class="headline">{{ nickname.user.username }}</span>
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="nickname.nickname"
          label="Nickname"
          autofocus
          @keyup.enter="setFriendNickname"
        />
        <small>Friend nicknames only show to you.</small>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="blue darken-1"
          text
          @click="
            nickname.dialog = false
            nickname.nickname = ''
            nickname.user = {}
          "
        >
          Cancel
        </v-btn>
        <v-btn color="blue darken-1" text @click="setFriendNickname">
          Apply
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler.js"

export default {
  name: "NicknameDialog",
  props: ["nickname"],
  methods: {
    setFriendNickname() {
      this.axios
        .post(
          process.env.VUE_APP_BASE_URL +
            "/api/v1/communications/nickname/" +
            this.nickname.user.id,
          {
            nickname: this.nickname.nickname
          }
        )
        .then((res) => {
          this.$store.state.chats.forEach((item) => {
            item.chat.associations.forEach((a) => {
              if (a.user.id === this.nickname.user.id) {
                a.user.nickname = {
                  nickname: res.data.nickname
                }
              }
            })
            item.chat.users.forEach((u) => {
              if (u.id === this.nickname.user.id) {
                u.nickname = {
                  nickname: res.data.nickname
                }
              }
            })
          })
          this.nickname.dialog = false
          this.nickname.nickname = ""
          this.nickname.user = {}
          this.$toast.success("Nickname changed successfully.")
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    }
  }
}
</script>

<style scoped></style>
