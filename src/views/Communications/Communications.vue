<template>
  <div id="communications">
    <v-container fluid>
      <v-row>
        <v-col>
          <router-view
            v-if="$route.params.id !== 'home'"
            :chat="selectedChat"
            :loading="false"
            :items="$store.state.chats"
          ></router-view>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: "Communications",
  computed: {
    selectedChat() {
      try {
        return this.$store.state.chats.find(
          (item) => item.id === JSON.parse(this.$route.params.id)
        )
      } catch {
        return null
      }
    }
  },
  mounted() {
    if (!this.$route.params.id) {
      this.$router.push("/communications/" + this.$store.state.lastChat)
    } else {
      this.$store.commit("setLastChat", this.$route.params.id || "friends")
    }
    this.$store.commit("setSelectedChat", this.selectedChat)
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
