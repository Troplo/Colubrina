<template>
  <v-dialog v-model="user.value" max-width="650px">
    <v-card v-if="user.item" class="user-popout" height="600px">
      <v-toolbar color="toolbar" height="100">
        <v-avatar size="64" class="mr-3 mb-2 mt-2">
          <v-img
            v-if="user.item.avatar"
            :src="$store.state.baseURL + '/usercontent/' + user.item.avatar"
            class="elevation-1"
          />
          <v-icon v-else class="elevation-1"> mdi-account </v-icon>
        </v-avatar>
        <v-toolbar-title>
          {{ getName(user.item) }}
          <v-tooltip v-if="user.item.admin" top>
            <template #activator="{ on }">
              <v-btn icon small v-on="on">
                <v-icon> mdi-crown </v-icon>
              </v-btn>
            </template>
            <span>Colubrina Instance Administrator</span>
          </v-tooltip>
          <v-tooltip v-if="user.item.id < 35" top>
            <template #activator="{ on }">
              <v-btn icon small v-on="on">
                <v-icon> mdi-alpha-a-circle </v-icon>
              </v-btn>
            </template>
            <span>Early User</span>
          </v-tooltip>
          <v-tooltip v-if="user.item.bot" top>
            <template #activator="{ on }">
              <v-btn icon small v-on="on">
                <v-icon> mdi-robot </v-icon>
              </v-btn>
            </template>
            <span>Bot</span>
          </v-tooltip>
          <div class="subheading subtitle-1 text--lighten-2">
            <template v-if="user.item.nickname">
              {{ user.item.username }}
            </template>
          </div>
        </v-toolbar-title>
      </v-toolbar>
      <v-tabs :show-arrows="false" fixed-tabs background-color="card">
        <v-tab>
          <v-icon>mdi-account-multiple</v-icon>&nbsp; Mutual Friends
        </v-tab>
        <v-tab> <v-icon>mdi-account-group</v-icon>&nbsp; Mutual Groups </v-tab>
        <v-tab-item
          :style="
            'background-color: ' +
            $vuetify.theme.themes[$vuetify.theme.dark ? 'dark' : 'light'].card
          "
        >
          <v-list
            :height="400"
            :style="
              'background-color: ' +
              $vuetify.theme.themes[$vuetify.theme.dark ? 'dark' : 'light'].card
            "
          >
            <v-overlay :value="loading.mutualFriends" absolute>
              <v-progress-circular indeterminate size="64" />
            </v-overlay>
            <v-list-item
              v-for="item in mutualFriends"
              :key="item.id"
              @click="openUserPanel(item)"
            >
              <v-list-item-title>
                <v-avatar size="24">
                  <v-img
                    v-if="item.avatar"
                    :src="$store.state.baseURL + '/usercontent/' + item.avatar"
                    class="elevation-1"
                  />
                  <v-icon v-else class="elevation-1"> mdi-account </v-icon>
                </v-avatar>
                {{ getName(item) }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-tab-item>
        <v-tab-item
          :style="
            'background-color: ' +
            $vuetify.theme.themes[$vuetify.theme.dark ? 'dark' : 'light'].card
          "
        >
          <v-list
            :height="400"
            :style="
              'background-color: ' +
              $vuetify.theme.themes[$vuetify.theme.dark ? 'dark' : 'light'].card
            "
          >
            <v-overlay :value="loading.mutualFriends" absolute>
              <v-progress-circular indeterminate size="64" />
            </v-overlay>
            <v-list-item
              v-for="item in mutualGroups"
              :key="item.id"
              @click="
                $router.push('/communications/' + item.associationId)
                user.value = false
              "
            >
              <v-list-item-title>
                {{ item.name }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-tab-item>
      </v-tabs>
      <v-card-actions
        :style="
          'background-color: ' +
          $vuetify.theme.themes[$vuetify.theme.dark ? 'dark' : 'light'].card
        "
      >
        <v-spacer />
        <v-btn color="primary" text @click="user.value = false"> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler.js"

export default {
  name: "UserDialog",
  props: ["user"],
  data() {
    return {
      mutualGroups: [],
      mutualFriends: [],
      loading: {
        mutualFriends: true,
        mutualGroups: true
      }
    }
  },
  mounted() {
    this.onMounted()
  },
  methods: {
    openUserPanel(user) {
      this.user.item = user
      this.onMounted()
    },
    getName(user) {
      if (user.nickname?.nickname) {
        return user.nickname.nickname
      } else {
        return user.username
      }
    },
    onMounted() {
      if (this.user?.item?.id) {
        this.mutualGroups = []
        this.mutualFriends = []
        this.loading = {
          mutualGroups: true,
          mutualFriends: true
        }
        this.axios
          .get(
            process.env.VUE_APP_BASE_URL +
              "/api/v1/communications/mutual/" +
              this.user.item.id +
              "/groups"
          )
          .then((res) => {
            this.mutualGroups = res.data
            this.loading.mutualGroups = false
          })
          .catch((e) => {
            AjaxErrorHandler(this.$store)(e)
          })
        this.axios
          .get(
            process.env.VUE_APP_BASE_URL +
              "/api/v1/communications/mutual/" +
              this.user.item.id +
              "/friends"
          )
          .then((res) => {
            this.mutualFriends = res.data
            this.loading.mutualFriends = false
          })
          .catch((e) => {
            AjaxErrorHandler(this.$store)(e)
          })
      }
    }
  }
}
</script>

<style scoped></style>
