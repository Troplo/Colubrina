<template>
  <div id="communications">
    <router-view
      v-if="$route.params.id !== 'home'"
      :chat="selectedChat"
      :loading="false"
      :items="$store.state.chats"
    ></router-view>
  </div>
</template>

<script>
export default {
  name: "Communications",
  computed: {
    selectedChat() {
      try {
        return this.$store.state.chats.find(
          (item) => item.id === parseInt(this.$route.params.id)
        )
      } catch {
        return null
      }
    }
  },
  mounted() {
    this.$socket.on("memberListUpdate", () => {
      this.$store.dispatch("getChats")
    })
    if (!this.$route.params.id) {
      this.$router.push("/communications/friends")
    }
  },
  watch: {
    selectedChat() {
      this.$store.commit("setSelectedChat", this.selectedChat)
    }
  }
}
</script>

<style scoped></style>
