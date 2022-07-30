<template>
  <div id="communications-friends">
    <v-card color="card" class="rounded-xl" :height="viewport()" elevation="0">
      <v-tabs centered background-color="card" v-model="tab">
        <v-tab :key="0">Users</v-tab>
        <v-tab :key="1"> Friends </v-tab>
        <v-tab :key="2"> Add new friend </v-tab>
        <v-tab-item
          :style="
            'background-color: ' +
            $vuetify.theme.themes[$vuetify.theme.dark ? 'dark' : 'light'].card
          "
        >
          <v-card class="rounded-xl" color="card" elevation="0">
            <v-toolbar color="toolbar" elevation="0">
              <v-toolbar-title> Users </v-toolbar-title>
            </v-toolbar>
            <v-card color="card" elevation="0">
              <v-list color="card" v-if="$store.state.site.publicUsers">
                <v-list-item v-for="user in users" :key="user.id">
                  <v-list-item-avatar
                    @click="userProfile(user)"
                    style="cursor: pointer"
                    :color="$vuetify.theme.themes.dark.primary"
                  >
                    <v-img
                      :src="'/usercontent/' + user.avatar"
                      v-if="user.avatar"
                    />
                    <v-icon v-else> mdi-account </v-icon>
                  </v-list-item-avatar>

                  <v-list-item-content
                    @click="userProfile(user)"
                    style="cursor: pointer"
                  >
                    <v-list-item-title>
                      {{ user.username }}
                      <v-tooltip top v-if="user.admin">
                        <template v-slot:activator="{ on }">
                          <v-btn icon v-on="on" class="ml-1">
                            <v-icon> mdi-crown </v-icon>
                          </v-btn>
                        </template>
                        <span>Admin</span>
                      </v-tooltip>
                    </v-list-item-title>
                  </v-list-item-content>
                  <v-list-item-action
                    v-if="
                      friendStatus(user) === 'none' &&
                      user.id !== $store.state.user.id
                    "
                  >
                    <v-btn icon>
                      <v-icon @click="addFriend(user)">mdi-account-plus</v-icon>
                    </v-btn>
                  </v-list-item-action>
                  <v-list-item-action
                    v-if="
                      friendStatus(user) === 'pending' &&
                      user.id !== $store.state.user.id
                    "
                  >
                    <v-btn disabled icon>
                      <v-icon>mdi-clock</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
              <v-card-title v-else
                >Public users are not enabled on this instance.</v-card-title
              >
            </v-card>
          </v-card>
        </v-tab-item>
        <v-tab-item
          :style="
            'background-color: ' +
            $vuetify.theme.themes[$vuetify.theme.dark ? 'dark' : 'light'].card
          "
        >
          <v-card class="rounded-xl" color="card" elevation="0">
            <v-toolbar color="toolbar" elevation="0">
              <v-toolbar-title> Incoming </v-toolbar-title>
            </v-toolbar>
            <v-card color="card" elevation="0">
              <v-list color="card">
                <v-list-item
                  v-for="friend in computePendingIncoming"
                  :key="friend.id"
                >
                  <v-list-item-avatar
                    @click="userProfile(friend.user2)"
                    :color="$vuetify.theme.themes.dark.primary"
                  >
                    <v-img
                      :src="'/usercontent/' + friend.user2.avatar"
                      v-if="friend.user2.avatar"
                    />
                    <v-icon v-else> mdi-account </v-icon>
                  </v-list-item-avatar>

                  <v-list-item-content @click="userProfile(friend.user2)">
                    <v-list-item-title>
                      {{ friend.user2.username }}
                    </v-list-item-title>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-btn icon>
                      <v-icon color="error" @click="removeFriend(friend)"
                        >mdi-close</v-icon
                      >
                    </v-btn>
                  </v-list-item-action>
                  <v-list-item-action>
                    <v-btn icon>
                      <v-icon color="success" @click="acceptFriend(friend)">
                        mdi-check</v-icon
                      >
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
            </v-card>
            <v-toolbar color="toolbar" elevation="0">
              <v-toolbar-title> Outgoing </v-toolbar-title>
            </v-toolbar>
            <v-card color="card" elevation="0">
              <v-list color="card">
                <v-list-item
                  v-for="friend in computePendingOutgoing"
                  :key="friend.id"
                >
                  <v-list-item-avatar
                    @click="userProfile(friend.user2)"
                    style="cursor: pointer"
                    :color="$vuetify.theme.themes.dark.primary"
                  >
                    <v-img
                      :src="'/usercontent/' + friend.user2.avatar"
                      v-if="friend.user2.avatar"
                    />
                    <v-icon v-else> mdi-account </v-icon>
                  </v-list-item-avatar>

                  <v-list-item-content
                    @click="userProfile(friend.user2)"
                    style="cursor: pointer"
                  >
                    <v-list-item-title>
                      {{ friend.user2.username }}
                    </v-list-item-title>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-btn icon>
                      <v-icon color="error" @click="removeFriend(friend)"
                        >mdi-close</v-icon
                      >
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
            </v-card>
            <v-toolbar color="toolbar" elevation="0">
              <v-toolbar-title> Friends </v-toolbar-title>
            </v-toolbar>
            <v-card color="card" elevation="0">
              <v-list color="card">
                <v-list-item v-for="friend in computeAccepted" :key="friend.id">
                  <v-list-item-avatar
                    @click="userProfile(friend.user2)"
                    style="cursor: pointer"
                    :color="$vuetify.theme.themes.dark.primary"
                  >
                    <v-img
                      :src="'/usercontent/' + friend.user2.avatar"
                      v-if="friend.user2.avatar"
                    />
                    <v-icon v-else> mdi-account </v-icon>
                  </v-list-item-avatar>

                  <v-list-item-content>
                    <v-list-item-title>
                      {{ friend.user2.username }}
                    </v-list-item-title>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-btn icon>
                      <v-icon color="error" @click="removeFriend(friend)"
                        >mdi-close</v-icon
                      >
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
            </v-card>
          </v-card>
        </v-tab-item>
        <v-tab-item
          :style="
            'background-color: ' +
            $vuetify.theme.themes[$vuetify.theme.dark ? 'dark' : 'light'].card
          "
        >
          <v-card color="card">
            <v-container>
              <b>Your username is: {{ $store.state.user.username }}</b>
              <p>
                To create a conversation with a user, you first need to be
                friends with them. You can add them here.
              </p>
              <v-text-field
                @keyup.enter="addFriend(null)"
                label="Friend username"
                :placeholder="'BTR0001'"
                v-model="friend"
              >
              </v-text-field>
            </v-container>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" text @click="addFriend(null)">
                Send Request
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-tab-item>
      </v-tabs>
    </v-card>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler"

export default {
  name: "CommunicationsFriends",
  data() {
    return {
      friends: [],
      friend: "",
      users: [],
      tab: 1
    }
  },
  computed: {
    computeAccepted() {
      return this.friends.filter((friend) => friend.status === "accepted")
    },
    computePendingOutgoing() {
      return this.friends.filter((friend) => friend.status === "pending")
    },
    computePendingIncoming() {
      return this.friends.filter(
        (friend) => friend.status === "pendingCanAccept"
      )
    }
  },
  methods: {
    userProfile() {
      // todo
    },
    viewport() {
      return window.innerHeight - 25
    },
    friendStatus(user) {
      return (
        this.friends.find((friend) => friend.user2.id === user.id)?.status ||
        "none"
      )
    },
    getUsers() {
      this.axios
        .get("/api/v1/communications/users")
        .then((res) => {
          this.users = res.data.sort((a, b) => {
            return a.updatedAt < b.updatedAt ? 1 : -1
          })
        })
        .catch((error) => {
          AjaxErrorHandler(error)
        })
    },
    acceptFriend(friend) {
      this.axios
        .put("/api/v1/friends/" + friend.id, {
          friend: friend.id,
          status: "accepted"
        })
        .then(() => {
          this.getFriends()
        })
        .catch((error) => {
          AjaxErrorHandler(error)
        })
    },
    removeFriend(friend) {
      this.axios
        .delete("/api/v1/friends/" + friend.id)
        .then(() => {
          this.getFriends()
        })
        .catch((error) => {
          AjaxErrorHandler(error)
        })
    },
    addFriend(user) {
      if (user) {
        this.axios
          .post("/api/v1/friends", {
            friend: user.username
          })
          .then(() => {
            this.getFriends()
            this.$toast.success("Friend request sent!")
          })
          .catch((e) => {
            AjaxErrorHandler(this.$store)(e)
          })
      } else {
        this.axios
          .post("/api/v1/friends", {
            friend: this.friend
          })
          .then(() => {
            this.getFriends()
            this.$toast.success("Friend request sent!")
          })
          .catch((e) => {
            AjaxErrorHandler(this.$store)(e)
          })
      }
    },
    getFriends() {
      this.axios.get("/api/v1/friends").then((res) => {
        this.friends = res.data
      })
    }
  },
  mounted() {
    this.getFriends()
    this.getUsers()
    this.$socket.on("friendRequest", () => {
      this.getFriends()
    })
    this.$socket.on("friendUpdate", () => {
      this.getFriends()
    })
    this.$socket.on("friendAccepted", () => {
      this.getFriends()
    })
  }
}
</script>

<style scoped></style>
