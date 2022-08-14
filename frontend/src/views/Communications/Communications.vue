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
  watch: {
    selectedChat() {
      this.$store.commit("setSelectedChat", this.selectedChat)
    },
    "$route.params.id"() {
      this.$store.commit("setLastChat", this.$route.params.id || "friends")
    }
  }
}
</script>

<style scoped></style>
