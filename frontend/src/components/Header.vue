<template>
  <div v-if="$store.state.user.username">
    <v-overlay :value="!$store.state.wsConnected" absolute>
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
    <NicknameDialog :nickname="nickname" />
    <v-menu
      v-model="context.user.value"
      :position-x="context.user.x"
      :position-y="context.user.y"
      absolute
      offset-y
      class="rounded-l"
    >
      <v-list class="rounded-l" v-if="context.user.item">
        <v-list-item
          v-if="context.user.item.type === 'direct'"
          @click="
            nickname.user = context.user.item
            nickname.dialog = true
          "
        >
          <v-list-item-title>Change Friend Nickname</v-list-item-title>
        </v-list-item>
        <v-list-item @click="groupSettings(context.user.id)">
          <v-list-item-title>Group Settings</v-list-item-title>
        </v-list-item>
        <v-list-item @click="groupLeave(context.user.id)" color="error">
          <v-list-item-title>Leave Group</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-dialog
      v-model="settings.addMembers.dialog"
      max-width="400px"
      v-if="settings.item"
    >
      <v-card color="card">
        <v-toolbar color="toolbar">
          <v-toolbar-title
            >Add User to {{ settings.item.chat.name }}</v-toolbar-title
          >
          <v-spacer></v-spacer>
          <v-btn icon @click.native="settings.addMembers.dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-container>
          <v-autocomplete
            v-model="settings.addMembers.users"
            :items="settings.addMembers.results"
            :search-input.sync="settings.addMembers.name"
            filled
            chips
            color="blue-grey lighten-2"
            label="Select"
            item-text="username"
            item-value="id"
            multiple
          >
            <template v-slot:selection="data">
              <v-chip
                v-bind="data.attrs"
                :input-value="data.selected"
                close
                @click="data.select"
                @click:close="remove(data.item)"
              >
                <v-avatar left v-if="data.item.avatar">
                  <v-img :src="'/usercontent/' + data.item.avatar"></v-img>
                </v-avatar>
                @{{ data.item.username }}
              </v-chip>
            </template>
            <template v-slot:item="data">
              <v-avatar left v-if="data.item.avatar" class="mr-3 mb-2 mt-2">
                <v-img :src="'/usercontent/' + data.item.avatar"></v-img>
              </v-avatar>
              <v-avatar left v-else class="mr-3 mb-2 mt-2">
                <v-icon>mdi-account</v-icon>
              </v-avatar>
              <v-list-item-content>
                @{{ data.item.username }}
              </v-list-item-content>
            </template>
          </v-autocomplete>
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="settings.addMembers.dialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="addMembersToGroup"
            :disabled="!settings.addMembers.users.length"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="settings.dialog" max-width="500px" v-if="settings.item">
      <v-card color="card">
        <v-toolbar color="toolbar">
          <v-toolbar-title>Group Settings</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click.native="settings.dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-container>
          <v-alert text type="info" v-if="settings.item.rank !== 'admin'">
            You need to be an administrator of this group to change settings.
          </v-alert>
          <v-card-title v-if="settings.item.rank === 'admin'"
            >General</v-card-title
          >
          <v-text-field
            label="Group Name"
            v-if="
              settings.item.chat.type === 'group' &&
              settings.item.rank === 'admin'
            "
            v-model="settings.item.chat.name"
          ></v-text-field>
          <v-card-title
            >Members
            <v-btn
              icon
              @click.native="settings.addMembers.dialog = true"
              v-if="settings.item.rank === 'admin'"
            >
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-card-title>
          <v-list>
            <v-list-item
              v-for="user in settings.item.chat.associations"
              :key="user.id"
            >
              <v-list-item-avatar :color="$vuetify.theme.themes.dark.primary">
                <v-img
                  :src="'/usercontent/' + user.user.avatar"
                  v-if="user.user.avatar"
                />
                <v-icon v-else> mdi-account </v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title
                  >{{ user.user.username }}
                  <v-btn text icon v-if="user.rank === 'admin'">
                    <v-icon> mdi-gavel </v-icon>
                  </v-btn>
                </v-list-item-title>
              </v-list-item-content>
              <v-list-item-action v-if="settings.item.rank === 'admin'">
                <v-tooltip top>
                  <template v-slot:activator="{ on, attrs }">
                    <div v-on="on" v-bind="attrs">
                      <v-btn icon @click="giveUserAdmin(user)">
                        <v-icon>mdi-account-arrow-up</v-icon>
                      </v-btn>
                    </div>
                  </template>
                  <span>Promote user to group admin (CANNOT BE UNDONE!)</span>
                </v-tooltip>
              </v-list-item-action>
              <v-list-item-action v-if="settings.item.rank === 'admin'">
                <v-btn icon @click="removeUserFromGroup(user)">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
          <v-btn
            v-if="
              settings.item.chat.type === 'group' &&
              settings.item.rank === 'admin'
            "
            text
            color="primary"
            @click="saveGroupSettings"
          >
            Save
          </v-btn>
        </v-container>
      </v-card>
    </v-dialog>
    <v-dialog v-model="leave.dialog" max-width="400px">
      <v-card color="card">
        <v-toolbar color="toolbar">
          <v-toolbar-title>Are you sure you want to leave?</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            icon
            @click.native="
              leave.dialog = false
              leave.item = null
            "
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-container>
          <p>
            You will not be able to rejoin this group unless you are added back
            manually.
          </p>
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click.native="leave.dialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" text @click.native="leaveGroup()"> Leave </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogs.new" max-width="500px">
      <v-card color="card">
        <v-toolbar color="toolbar">
          <v-toolbar-title>New Communication</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click.native="dialogs.new = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-container>
          <v-autocomplete
            v-model="newConversation.users"
            :items="newConversation.results"
            :search-input.sync="newConversation.name"
            filled
            chips
            color="blue-grey lighten-2"
            label="Select"
            item-text="username"
            item-value="id"
            multiple
          >
            <template v-slot:selection="data">
              <v-chip
                v-bind="data.attrs"
                :input-value="data.selected"
                close
                @click="data.select"
                @click:close="remove(data.item)"
              >
                <v-avatar left v-if="data.item.avatar">
                  <v-img :src="'/usercontent/' + data.item.avatar"></v-img>
                </v-avatar>
                @{{ data.item.username }}
              </v-chip>
            </template>
            <template v-slot:item="data">
              <v-avatar left v-if="data.item.avatar" class="mr-3 mb-2 mt-2">
                <v-img :src="'/usercontent/' + data.item.avatar"></v-img>
              </v-avatar>
              <v-avatar left v-else class="mr-3 mb-2 mt-2">
                <v-icon>mdi-account</v-icon>
              </v-avatar>
              <v-list-item-content>
                @{{ data.item.username }}
              </v-list-item-content>
            </template>
          </v-autocomplete>
          <small
            >If the person you want to add doesn't appear, ensure you are
            friends with them. You can add additional friends with the Friends
            button located on the top left.</small
          >
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="dialogs.new = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="newConversation.loading"
            text
            @click="createConversation"
            :disabled="!newConversation.users.length"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-app-bar app color="bg">
      <v-app-bar-nav-icon
        @click.stop="$store.state.drawer = !$store.state.drawer"
        v-if="$vuetify.breakpoint.mobile || !$store.state.drawer"
      ></v-app-bar-nav-icon>
      <button
        style="display: none"
        v-shortkey="['ctrl', 'k']"
        @shortkey="$store.commit('setSearch', true)"
      >
        Debug
      </button>
      <button
        style="display: none"
        v-shortkey="['meta', 'k']"
        @shortkey="$store.commit('setSearch', true)"
      >
        Debug
      </button>
      <button
        style="display: none"
        v-shortkey="['ctrl', 'alt', 'd']"
        @shortkey="$store.dispatch('toggleCSS')"
      >
        Style Toggle
      </button>
      <button
        style="display: none"
        v-shortkey="['f9']"
        @shortkey="$store.dispatch('toggleCSS')"
      >
        Style Toggle
      </button>
      <button
        style="display: none"
        v-shortkey="['ctrl', 'f']"
        @shortkey="$store.state.searchPanel = true"
      >
        Debug
      </button>
      <template v-if="$route.name === 'Communications'">
        <v-toolbar-title v-if="$store.state.selectedChat?.chat?.type">
          {{
            $store.state.selectedChat?.chat?.type === "direct"
              ? getDirectRecipient($store.state.selectedChat).username
              : $store.state.selectedChat?.chat?.name
          }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          icon
          @click="$store.state.searchPanel = !$store.state.searchPanel"
        >
          <v-icon>mdi-magnify</v-icon>
        </v-btn>
        <v-btn icon @click="$store.state.userPanel = !$store.state.userPanel">
          <v-icon>mdi-account-group</v-icon>
        </v-btn>
      </template>
      <template v-else>
        <v-toolbar-title>
          {{ $route.name }}
        </v-toolbar-title>
      </template>
    </v-app-bar>
    <v-navigation-drawer
      color="bg"
      floating
      app
      style="max-height: 100%"
      v-model="$store.state.drawer"
      :width="$vuetify.breakpoint.mobile ? 270 : 320"
    >
      <v-container>
        <v-list dense nav id="comms-sidebar-list">
          <template v-if="$vuetify.breakpoint.mobile">
            <v-btn
              color="toolbar"
              to="/communications/friends"
              width="48%"
              class="mb-3 mr-1 rounded-xl"
              elevation="2"
            >
              <v-icon left>mdi-account-multiple</v-icon>
              Friends
            </v-btn>
            <v-btn
              color="toolbar"
              width="48%"
              class="mb-3 ml-1 rounded-xl"
              elevation="2"
              @click="dialogs.new = true"
            >
              <v-icon left>mdi-plus</v-icon>
              New
            </v-btn>
          </template>
          <template v-else>
            <v-btn
              color="toolbar"
              to="/communications/friends"
              block
              class="mb-3 rounded-xl"
              elevation="2"
            >
              <v-icon left>mdi-account-multiple</v-icon>
              Friends
            </v-btn>
            <v-text-field
              class="rounded-xl"
              filled
              solo
              label="Search..."
              append-icon="mdi-magnify"
              background-color="toolbar"
              style="margin-bottom: -18px"
              elevation="2"
              v-model="search"
            ></v-text-field>
            <v-toolbar color="toolbar" class="rounded-xl mb-3" elevation="2">
              <v-toolbar-title class="subtitle-1">
                CHATS ({{ chats.length }})
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon @click="dialogs.new = true">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-toolbar></template
          >
          <v-list v-for="item in chats" :key="item.id">
            <template>
              <v-list-item
                :to="'/communications/' + item.id"
                @contextmenu="
                  show($event, 'user', getDirectRecipient(item), item.id)
                "
              >
                <v-badge
                  bordered
                  bottom
                  :color="getStatus(item)"
                  v-if="item.chat.type === 'direct'"
                  dot
                  offset-x="24"
                  offset-y="20"
                >
                  <v-list-item-avatar
                    :color="$vuetify.theme.themes.dark.primary"
                  >
                    <v-icon v-if="item.chat.type === 'group'">
                      mdi-account-group
                    </v-icon>
                    <v-img
                      v-else-if="
                        item.chat.type === 'direct' &&
                        getDirectRecipient(item).avatar
                      "
                      :src="
                        $store.state.baseURL +
                        '/usercontent/' +
                        getDirectRecipient(item).avatar
                      "
                    />
                    <v-icon v-else-if="item.chat.type === 'direct'">
                      mdi-account
                    </v-icon>
                  </v-list-item-avatar>
                </v-badge>
                <v-badge dot color="none" v-else>
                  <v-list-item-avatar
                    :color="$vuetify.theme.themes.dark.primary"
                  >
                    <v-icon v-if="item.chat.type === 'group'">
                      mdi-account-group
                    </v-icon>
                  </v-list-item-avatar>
                </v-badge>
                <template>
                  <v-list-item-content>
                    <v-list-item-title v-if="item.chat.type === 'direct'">
                      {{ getDirectRecipient(item).name }}
                    </v-list-item-title>
                    <v-list-item-title v-else>
                      <span> {{ item.chat.name }} </span>
                    </v-list-item-title>

                    <v-list-item-subtitle v-if="item.chat.type === 'group'">
                      {{ item.chat.users.length }} Members
                    </v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-action
                    v-if="
                      item.unread >= 1 &&
                      $route.params.id !== item.id.toString()
                    "
                  >
                    <v-badge color="red" inline :content="item.unread">
                    </v-badge>
                  </v-list-item-action>
                </template>
              </v-list-item>
            </template>
          </v-list>
        </v-list>
      </v-container>
      <template v-slot:append>
        <v-card tile color="bg" elevation="0">
          <v-overlay :value="!$store.state.wsConnected" absolute>
            <v-progress-circular indeterminate size="48"></v-progress-circular>
          </v-overlay>
          <v-list-item>
            <v-menu top offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-badge
                  bordered
                  bottom
                  :color="getStatusForUser()"
                  dot
                  offset-x="26"
                  offset-y="19"
                  v-on="on"
                  v-bind="attrs"
                >
                  <v-list-item-avatar
                    :color="$vuetify.theme.themes.dark.primary"
                    v-on="on"
                    v-bind="attrs"
                  >
                    <v-img
                      v-if="$store.state.user.avatar"
                      :src="'/usercontent/' + $store.state.user.avatar"
                    />
                    <v-icon v-else> mdi-account </v-icon>
                  </v-list-item-avatar>
                </v-badge>
              </template>

              <v-list>
                <v-list-item @click="setStatus('online')">
                  <v-list-item-title>Online</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setStatus('away')">
                  <v-list-item-title>Idle</v-list-item-title>
                </v-list-item>
                <v-list-item two-line @click="setStatus('busy')">
                  <v-list-item-content>
                    <v-list-item-title>Do not Disturb</v-list-item-title>
                    <v-list-item-subtitle class="text-wrap"
                      >You will not receive any
                      notifications.</v-list-item-subtitle
                    >
                  </v-list-item-content>
                </v-list-item>
                <v-list-item two-line @click="setStatus('invisible')">
                  <v-list-item-content>
                    <v-list-item-title>Invisible</v-list-item-title>
                    <v-list-item-subtitle class="text-wrap"
                      >You will appear as offline, and the typing indicator will
                      be disabled.</v-list-item-subtitle
                    >
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-tooltip v-model="copyTooltip" top>
              <template v-slot:activator="{ attrs }">
                <v-list-item-content
                  @click="copyUsername"
                  v-bind="attrs"
                  style="cursor: pointer; min-width: 100px"
                >
                  <v-list-item-title>
                    {{ $store.state.user.username }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ $store.state.user.storedStatus }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </template>
              <span>Copied!</span>
            </v-tooltip>
            <v-spacer></v-spacer>
            <v-btn
              icon
              text
              to="/admin"
              v-if="$store.state.user.admin"
              style="margin-right: 0; padding-right: 0"
            >
              <v-icon>mdi-gavel</v-icon>
            </v-btn>
            <v-btn icon text to="/settings">
              <v-icon>mdi-cog</v-icon>
            </v-btn>
          </v-list-item>
        </v-card>
      </template>
    </v-navigation-drawer>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler"
import NicknameDialog from "@/components/NicknameDialog"
import Vue from "vue"

export default {
  name: "Header",
  components: { NicknameDialog },
  data() {
    return {
      search: "",
      nickname: {
        dialog: false,
        nickname: "",
        user: {}
      },
      copyTooltip: false,
      settings: {
        dialog: false,
        addMembers: {
          dialog: false,
          users: [],
          results: [],
          name: ""
        },
        item: null
      },
      context: {
        user: {
          value: false,
          x: null,
          y: null,
          item: null,
          id: 0
        },
        userPopout: {
          value: false,
          x: null,
          y: null,
          item: null,
          id: 0
        },
        message: {
          value: false,
          x: null,
          y: null,
          item: null
        }
      },
      selected: [2],
      loading: true,
      leave: {
        item: null,
        dialog: false
      },
      newConversation: {
        name: "",
        users: [],
        loading: false,
        results: []
      },
      dialogs: {
        new: false
      }
    }
  },
  computed: {
    chats() {
      if (!this.search?.length) {
        return this.$store.state.chats
      }
      return this.$store.state.chats.filter((item) => {
        return (
          (item.chat.type === "group" &&
            item.chat.name.toLowerCase().includes(this.search.toLowerCase())) ||
          (item.chat.type === "direct" &&
            this.getDirectRecipient(item)
              .name.toLowerCase()
              .includes(this.search.toLowerCase()))
        )
      })
    }
  },
  methods: {
    groupSettings(id) {
      this.settings.item = this.$store.state.chats.find(
        (chat) => chat.id === id
      )
      this.settings.dialog = true
    },
    groupLeave(id) {
      this.leave.item = this.$store.state.chats.find((chat) => chat.id === id)
      this.leave.dialog = true
    },
    show(e, context, item, id) {
      e.preventDefault()
      this.context[context].value = false
      this.context[context].x = e.clientX
      this.context[context].y = e.clientY
      this.context[context].item = item
      this.context[context].id = id
      this.$nextTick(() => {
        this.context[context].value = true
      })
    },
    setStatus(status) {
      const previousStatus = {
        status: this.$store.state.user.status,
        storedStatus: this.$store.state.user.storedStatus
      }
      this.$store.state.user.status = status
      this.$store.state.user.storedStatus = status
      this.axios
        .put("/api/v1/user/settings/status", {
          status: status
        })
        .then((res) => {
          this.$store.state.user.status = res.data.status
          this.$store.state.user.storedStatus = res.data.storedStatus
        })
        .catch((e) => {
          if (e.response.data.status) {
            this.$store.state.user.status = e.response.data.status
            this.$store.state.user.storedStatus = e.response.data.storedStatus
          } else {
            AjaxErrorHandler(this.$store)(e)
            this.$store.state.user.status = previousStatus.status
            this.$store.state.user.storedStatus = previousStatus.storedStatus
          }
        })
    },
    copyUsername() {
      navigator.clipboard.writeText(this.$store.state.user.username)
      this.copyTooltip = true
      setTimeout(() => {
        this.copyTooltip = false
      }, 1000)
    },
    getStatusForUser() {
      if (this.$store.state.user.storedStatus === "online") {
        return "green"
      } else if (this.$store.state.user.storedStatus === "invisible") {
        return "grey"
      } else if (this.$store.state.user.storedStatus === "busy") {
        return "red"
      } else if (this.$store.state.user.storedStatus === "away") {
        return "orange"
      } else {
        return "grey"
      }
    },
    removeUserFromGroup(user) {
      this.axios
        .delete("/api/v1/association/" + this.settings.item.id + "/" + user.id)
        .then(() => {
          this.$toast.success("User has been removed from the group.")
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    giveUserAdmin(user) {
      this.axios
        .put("/api/v1/association/" + this.settings.item.id + "/" + user.id, {
          rank: "admin"
        })
        .then(() => {
          this.$toast.success("User has been promoted to admin.")
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    saveGroupSettings() {
      if (this.settings.item.chat.name.length < 1) {
        this.$toast.error("Group name must be at least 1 character long.")
        return
      }
      this.settings.item.loading = true
      this.axios
        .put("/api/v1/communications/" + this.settings.item.id, {
          name: this.settings.item.chat.name
        })
        .then(() => {
          this.settings.item.loading = false
          this.$toast.success("Group settings saved.")
          this.settings.dialog = false
        })
        .catch((e) => {
          this.settings.item.loading = false
          AjaxErrorHandler(this.$store)(e)
        })
    },
    viewport() {
      return window.innerHeight
    },
    addMembersToGroup() {
      this.axios
        .post("/api/v1/association/" + this.settings.item.chat.id, {
          users: this.settings.addMembers.users
        })
        .then(() => {
          this.settings.item.chat.users = this.settings.item.chat.users.concat(
            this.settings.addMembers.users
          )
          this.settings.addMembers.dialog = false
          this.settings.addMembers.users = []
          this.settings.addMembers.results = []
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    leaveGroup() {
      this.axios
        .delete("/api/v1/association/" + this.leave.item.id)
        .then(() => {
          this.leave.dialog = false
          this.$store.state.chats = this.$store.state.chats.filter(
            (chat) => chat.id !== this.leave.item.id
          )
          this.$router.push("/communications/friends")
          this.leave.item = null
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    getLastRead(item) {
      const message = item?.chat?.lastMessages?.find(
        (message) => message.id === item.lastRead
      )
      const lastMessage = item?.chat?.lastMessages?.find(
        (message) => message.userId !== this.$store.state.user.id
      )
      if (message && lastMessage) {
        const index = item.chat.lastMessages.indexOf(message)
        const indexLast = item.chat.lastMessages.indexOf(lastMessage)
        let value = index - indexLast
        if (value < 0) {
          value = 0
        }
        return {
          count: value,
          lastMessageTimestamp: lastMessage.createdAt
        }
      } else if (!message) {
        return {
          count: item.chat.lastMessages?.length,
          lastMessageTimestamp: lastMessage?.createdAt
        }
      } else if (!lastMessage) {
        return {
          count: 0,
          lastMessageTimestamp: undefined
        }
      } else {
        return {
          count: item.chat.lastMessages.length,
          lastMessageTimestamp: lastMessage?.createdAt
        }
      }
    },
    getStatus(item) {
      if (this.getDirectRecipient(item).status === "online") {
        return "green"
      } else if (this.getDirectRecipient(item).status === "offline") {
        return "grey"
      } else if (this.getDirectRecipient(item).status === "away") {
        return "orange"
      } else if (this.getDirectRecipient(item).status === "busy") {
        return "red"
      } else {
        return "grey"
      }
    },
    getDirectRecipient(item) {
      let user = item.chat.users.find(
        (user) => user.id !== this.$store.state.user.id
      )
      if (user) {
        if (user.nickname?.nickname) {
          user.name = user.nickname.nickname
        } else {
          user.name = user.username
        }
        return {
          ...user,
          type: item.chat.type
        }
      } else {
        let user = item.chat.users[0]
        if (user.nickname?.nickname) {
          user.name = user.nickname.nickname
        } else {
          user.name = user.username
        }
        return {
          ...user,
          type: item.chat.type
        }
      }
    },
    createConversation() {
      this.newConversation.loading = true
      this.axios
        .post(process.env.VUE_APP_BASE_URL + "/api/v1/communications/create", {
          users: this.newConversation.users
        })
        .then((res) => {
          this.newConversation.name = ""
          this.newConversation.users = []
          this.newConversation.loading = false
          this.dialogs.new = false
          this.$router.push("/communications/" + res.data.id)
        })
        .catch((e) => {
          this.newConversation.loading = false
          AjaxErrorHandler(this.$store)(e)
        })
    },
    remove(item) {
      const index = this.newConversation.users.indexOf(item.id)
      if (index >= 0) this.newConversation.users.splice(index, 1)
    },
    searchUsers() {
      this.newConversation.loading = true
      this.axios
        .get("/api/v1/communications/search?query=")
        .then((res) => {
          this.newConversation.loading = false
          this.newConversation.results = res.data
        })
        .catch(() => {
          this.newConversation.loading = false
        })
    },
    searchUsersForGroupAdmin() {
      this.axios
        .get("/api/v1/communications/search?query=")
        .then((res) => {
          if (this.settings.item) {
            this.settings.addMembers.results = res.data
            this.settings.addMembers.results =
              this.settings.addMembers.results.filter(
                (user) =>
                  !this.settings.item.chat.users.find((u) => u.id === user.id)
              )
          }
        })
        .catch(() => {})
    }
  },
  mounted() {
    Vue.axios.defaults.headers.common["Authorization"] =
      localStorage.getItem("session")
    this.searchUsers()
    this.searchUsersForGroupAdmin()
    this.$store.dispatch("getChats")
    this.$socket.on("friendUpdate", () => {
      this.searchUsers()
      this.searchUsersForGroupAdmin()
    })
    this.$socket.on("siteState", () => {
      this.searchUsers()
      this.searchUsersForGroupAdmin()
    })
    this.$socket.on("userSettings", () => {
      this.$store.dispatch("getChats")
    })
    this.$socket.on("chatUpdated", () => {
      this.$store.dispatch("getChats")
    })
    this.$socket.on("chatAdded", (chat) => {
      this.$store.commit("addChat", chat)
    })
    this.$socket.on("userStatus", (event) => {
      this.$store.state.chats.forEach((item) => {
        item.chat.associations.forEach((a) => {
          if (a.user.id === event.userId) {
            a.user.status = event.status
          }
        })
        item.chat.users.forEach((u) => {
          if (u.id === event.userId) {
            u.status = event.status
          }
        })
      })
    })
    this.$socket.on("message", (message) => {
      const chat = this.$store.state.chats.find(
        (item) => item.chatId === message.chatId
      )
      if (chat) {
        const index = this.$store.state.chats.indexOf(chat)
        this.$store.state.chats.splice(index, 1)
        this.$store.state.chats.unshift(chat)
      }
    })
    this.$socket.on("readChat", (chat) => {
      const item = this.$store.state.chats.find((item) => item.id === chat.id)
      if (item) {
        const index = this.$store.state.chats.indexOf(item)
        console.log(this.$store.state.chats[index].lastRead)
        this.$store.state.chats[index].lastRead = chat.lastRead
        this.$store.state.communicationNotifications = 0
        this.$store.state.chats.forEach((item) => {
          this.$store.state.communicationNotifications +=
            this.getLastRead(item).count
        })
      }
    })
  }
}
</script>

<style scoped></style>
