<template>
  <div id="communications-chat" @dragover.prevent @drop.prevent="handleDrag">
    <v-menu
      :position-x="$store.state.context.pins.x"
      :position-y="60"
      v-model="$store.state.context.pins.value"
      class="rounded-l"
      absolute
      transition="scroll-y-transition"
      :close-on-content-click="false"
      style="z-index: 15"
    >
      <v-card min-width="400" max-width="400" color="toolbar">
        <v-toolbar color="toolbar lighten-1">
          <v-spacer></v-spacer>
          <v-toolbar-title> Pins </v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-divider></v-divider>
        <v-container>
          <v-list dense v-if="pins.length">
            <v-list-item
              @click.self="jumpToMessage(pin.message.id)"
              v-for="(pin, index) in pins"
              :key="index"
            >
              <SimpleMessage
                :message="pin.message"
                :index="index"
                :key="pin.message.keyId"
              ></SimpleMessage>
              <v-spacer></v-spacer>
              <v-btn icon text @click="removePin(pin.messageId)">
                <v-icon> mdi-close </v-icon>
              </v-btn>
            </v-list-item>
          </v-list>
          <v-list-item v-else-if="pinsLoading">
            <v-list-item-title> Loading... </v-list-item-title>
          </v-list-item>
          <v-list-item v-else>
            <v-list-item-title> This chat has no pins yet. </v-list-item-title>
          </v-list-item>
        </v-container>
      </v-card>
    </v-menu>
    <v-menu
      v-model="context.message.value"
      :position-x="context.message.x"
      :position-y="context.message.y"
      absolute
      offset-y
      class="rounded-l"
    >
      <v-list class="rounded-l" v-if="context.message.item">
        <v-list-item @click="copy(context.message.item.content)">
          <v-list-item-title>Copy Message Content</v-list-item-title>
        </v-list-item>
        <v-list-item @click="replying = context.message.item">
          <v-list-item-title>Reply to Message</v-list-item-title>
        </v-list-item>
        <v-list-item
          @click="
            edit.content = context.message.item.content
            edit.editing = true
            edit.id = context.message.item.id
          "
          v-if="
            context.message.item.userId === $store.state.user.id &&
            edit.id !== context.message.item.id
          "
        >
          <v-list-item-title>Edit Message</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="context.message.item.userId === $store.state.user.id"
          @click="deleteMessage(context.message.item)"
        >
          <v-list-item-title>Delete Message</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <UserDialog
      :user="context.userPopout"
      :key="context.userPopout.item?.id || 0"
    ></UserDialog>
    <NicknameDialog :nickname="nickname" />
    <v-dialog
      v-model="preview.dialog"
      elevation="0"
      :min-height="300"
      :max-width="1000"
      :max-height="600"
      content-class="rounded-0"
    >
      <v-card color="card">
        <v-img
          :src="preview.src"
          :max-width="1000"
          :max-height="600"
          :min-height="300"
          contain
        ></v-img>
        <v-container>
          <a :href="preview.src" style="text-decoration: none" target="_blank">
            <small> Open Externally </small>
          </a>
          <small
            class="float-end"
            style="text-decoration: none; color: inherit"
          >
            {{ preview.name }}
          </small>
        </v-container>
      </v-card>
    </v-dialog>
    <v-card
      color="card"
      v-if="loading"
      style="overflow: scroll; height: calc(100vh - 24px - 40px - 40px)"
    >
      <v-overlay :value="loading" absolute>
        <v-progress-circular indeterminate size="64"></v-progress-circular>
      </v-overlay>
    </v-card>
    <v-navigation-drawer
      v-model="$store.state.userPanel"
      color="bg"
      floating
      v-if="!loading && $vuetify.breakpoint.mobile"
      app
      right
      style="z-index: 100"
    >
      <v-list two-line color="card">
        <v-list-item-group class="rounded-xl">
          <template v-for="item in associations">
            <v-list-item
              :key="item.title"
              @contextmenu="show($event, 'user', item.user)"
              @click="openUserPanel(item.user)"
              :id="'user-popout-' + item.userId"
            >
              <v-badge
                bordered
                bottom
                :color="getStatus(item.user)"
                dot
                offset-x="24"
                offset-y="26"
              >
                <v-list-item-avatar :color="$vuetify.theme.themes.dark.primary">
                  <v-img
                    v-if="item.user.avatar"
                    :src="
                      $store.state.baseURL + '/usercontent/' + item.user.avatar
                    "
                  />
                  <v-icon v-else> mdi-account </v-icon>
                </v-list-item-avatar>
              </v-badge>
              <template>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ getName(item.user) }}
                  </v-list-item-title>
                </v-list-item-content>
              </template>
            </v-list-item>
          </template>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
    <v-row v-if="!loading" @drop="handleDrag" no-gutters>
      <v-col class="flex-grow-1 flex-shrink-1 pb-0" id="chat-col">
        <v-card
          class="d-flex flex-column fill-height rounded-0 mb-n3"
          style="overflow: auto; height: calc(100vh - 24px - 40px)"
          color="card"
          elevation="0"
        >
          <v-card-text class="flex-grow-1 overflow-y-auto" id="message-list">
            <v-card-title
              v-if="
                reachedTop && $store.state.selectedChat?.chat?.type === 'group'
              "
            >
              Welcome to the start of
              {{
                $store.state.selectedChat?.chat?.type === "direct"
                  ? getDirectRecipient($store.state.selectedChat).username
                  : $store.state.selectedChat?.chat?.name
              }}
            </v-card-title>
            <v-card-title v-else-if="reachedTop">
              Welcome to the start of the conversation with
              {{
                $store.state.selectedChat?.chat?.type === "direct"
                  ? getDirectRecipient($store.state.selectedChat).username
                  : $store.state.selectedChat?.chat?.name
              }}
            </v-card-title>
            <v-progress-circular
              v-if="loadingMessages"
              indeterminate
              size="64"
              style="display: block; width: 100px; margin: 0 auto"
            ></v-progress-circular>
            <template v-for="(message, index) in messages">
              <Message
                :key="message.keyId"
                :message="message"
                :jump-to-message="jumpToMessage"
                :edit="edit"
                :focus-input="focusInput"
                :replying="setReply"
                :get-name="getName"
                :end-edit="endEdit"
                :auto-scroll="autoScroll"
                :chat="chat"
                :index="index"
                :show="show"
                :set-image-preview="setImagePreview"
                :delete-message="deleteMessage"
                :last-message="
                  messages[index - 1]?.userId === message?.userId &&
                  $date(message.createdAt).diff(
                    messages[index - 1]?.createdAt,
                    'minute'
                  ) < 10 &&
                  !message.replyId
                "
              ></Message>
              <div
                :key="'div2-' + message.keyId"
                v-if="message.readReceipts.length"
              >
                <v-tooltip
                  v-for="association in message.readReceipts"
                  :key="association.id"
                  top
                >
                  <template
                    v-slot:activator="{ on }"
                    v-if="association.user.id !== $store.state.user.id"
                  >
                    <v-btn
                      icon
                      small
                      fab
                      width="20"
                      height="20"
                      class="ml-2 mt-2"
                      style="float: right"
                      @click="openUserPanel(association.user)"
                    >
                      <v-avatar size="20" v-on="on" color="primary">
                        <img
                          v-if="association.user.avatar"
                          :src="
                            $store.state.baseURL +
                            '/usercontent/' +
                            association.user.avatar
                          "
                          alt="avatar"
                        />
                        <span v-else>{{
                          association.user.username[0].toUpperCase()
                        }}</span>
                      </v-avatar>
                    </v-btn>
                  </template>
                  <span>
                    {{ association.user.username }} has read up to this point.
                  </span>
                </v-tooltip>
                <br v-if="index + 1 > messages.length" />
                <br v-if="index + 1 > messages.length" />
              </div>
            </template>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn
                  icon
                  small
                  fab
                  width="20"
                  height="20"
                  class="ml-2 mt-2"
                  style="float: right"
                  @click="openUserPanel($store.state.user)"
                >
                  <v-avatar size="20" v-on="on" color="primary">
                    <img
                      v-if="$store.state.user.avatar"
                      :src="
                        $store.state.baseURL +
                        '/usercontent/' +
                        $store.state.user.avatar
                      "
                      alt="avatar"
                    />
                    <span v-else>{{
                      $store.state.user.username[0].toUpperCase()
                    }}</span>
                  </v-avatar>
                </v-btn>
              </template>
              <span>
                {{ $store.state.user.username }} has read up to this point.
              </span>
            </v-tooltip>
          </v-card-text>
          <v-card-text>
            <v-toolbar
              @click="jumpToMessage(replying?.id)"
              elevation="0"
              height="35"
              color="card"
              v-if="replying"
              style="cursor: pointer; overflow: hidden"
            >
              <v-icon class="mr-2">mdi-reply</v-icon>
              <v-avatar size="24" class="mr-2">
                <v-img
                  :src="
                    $store.state.baseURL +
                    '/usercontent/' +
                    replying.user.avatar
                  "
                  v-if="replying.user.avatar"
                  class="elevation-1"
                />
                <v-icon v-else class="elevation-1"> mdi-account </v-icon>
              </v-avatar>
              <template v-if="replying.attachments.length">
                <v-icon class="mr-2">mdi-file-image</v-icon>
              </template>
              <template v-if="!replying.content && replying.attachments.length">
                Click to view attachment
              </template>
              {{ replying.content.substring(0, 100) }}
              <v-spacer></v-spacer>
              <v-btn icon @click="replying = null" class="mr-2" small>
                <v-icon> mdi-close </v-icon>
              </v-btn>
            </v-toolbar>
            <v-fade-transition v-model="avoidAutoScroll">
              <v-toolbar
                height="22"
                color="toolbar"
                elevation="0"
                style="
                  border-radius: 20px 20px 0 0;
                  cursor: pointer;
                  position: relative;
                  top: -30px;
                  margin-bottom: -27px;
                "
                width="100%"
                @click="forceBottom"
                v-if="avoidAutoScroll"
              >
                <div>
                  <v-icon size="16px"> mdi-arrow-down </v-icon>
                  Jump to bottom...
                </div>
              </v-toolbar>
            </v-fade-transition>
            <v-fade-transition
              v-model="usersTyping.length"
              v-if="$vuetify.breakpoint.mobile"
            >
              <div
                style="
                  border-radius: 0 0 20px 20px;
                  position: relative;
                  top: -30px;
                  margin-bottom: -22px;
                "
                v-if="usersTyping.length"
              >
                {{ usersTyping.map((user) => getName(user)).join(", ") }}
                {{ usersTyping.length > 1 ? " are" : " is" }} typing...
              </div>
            </v-fade-transition>
            <CommsInput
              :chat="chat"
              :replying="replying"
              :editLastMessage="editLastMessage"
              :autoScroll="autoScroll"
              :endSend="endSend"
            ></CommsInput>
            <v-fade-transition
              v-model="usersTyping.length"
              v-if="!$vuetify.breakpoint.mobile"
            >
              <div
                style="
                  border-radius: 0 0 20px 20px;
                  position: absolute;
                  margin-top: -2px;
                  bottom: 1px;
                "
                v-if="usersTyping.length"
              >
                {{ usersTyping.map((user) => getName(user)).join(", ") }}
                {{ usersTyping.length > 1 ? " are" : " is" }} typing...
              </div>
            </v-fade-transition>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col
        cols="3"
        class=""
        id="search-col"
        v-if="$store.state.searchPanel && !$vuetify.breakpoint.mobile"
        style="z-index: 15"
      >
        <v-card
          class="d-flex flex-column fill-height"
          style="overflow: scroll; height: calc(100vh - 24px - 40px)"
          color="card"
          elevation="0"
        >
          <v-toolbar color="toolbar" class="flex-grow-0 flex-shrink-0">
            <v-toolbar-title>
              Search ({{ search.pager.totalItems || 0 }})
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="$store.state.searchPanel = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-text class="flex-grow-1 overflow-y-auto">
            <v-text-field
              v-model="search.query"
              label="Search"
              outlined
              autofocus
              @keydown.enter="doSearch"
              @keydown.esc="$store.state.searchPanel = false"
            ></v-text-field>
            <v-list two-line color="card" ref="message-list-search">
              <template v-for="(message, index) in search.results">
                <div
                  @click="jumpToMessage(message.id)"
                  :key="message.keyId"
                  style="cursor: pointer"
                >
                  <Message
                    :message="message"
                    :jump-to-message="jumpToMessage"
                    :edit="edit"
                    :focus-input="focusInput"
                    :replying="setReply"
                    :get-name="getName"
                    :end-edit="endEdit"
                    :auto-scroll="autoScroll"
                    :chat="chat"
                    :index="index"
                    :show="show"
                    :set-image-preview="setImagePreview"
                    :delete-message="deleteMessage"
                    :last-message="false"
                  ></Message>
                </div>
              </template>
              <v-pagination
                v-model="search.page"
                class="my-4"
                :length="search.pager.totalPages"
                @input="doSearch"
              ></v-pagination>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col
        :cols="$vuetify.breakpoint.xl ? 2 : 3"
        id="user-col"
        v-if="
          $store.state.userPanel &&
          !$vuetify.breakpoint.mobile &&
          !$store.state.searchPanel
        "
      >
        <v-card
          class="d-flex flex-column fill-height rounded-0"
          elevation="0"
          style="overflow: scroll; height: calc(100vh - 24px - 40px)"
          color="sheet"
        >
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
                @click="
                  nickname.dialog = true
                  nickname.user = context.user.item
                "
              >
                <v-list-item-title
                  >Change Friend Nickname for
                  {{ context.user.item.username }}</v-list-item-title
                >
              </v-list-item>
            </v-list>
          </v-menu>
          <v-list two-line color="sheet">
            <v-list-item-group class="rounded-xl">
              <template v-for="item in associations">
                <v-list-item
                  :key="item.title"
                  @contextmenu="show($event, 'user', item.user)"
                  @click="openUserPanel(item.user)"
                  :id="'user-popout-' + item.userId"
                >
                  <v-badge
                    bordered
                    bottom
                    :color="getStatus(item.user)"
                    dot
                    offset-x="24"
                    offset-y="26"
                  >
                    <v-list-item-avatar
                      :color="$vuetify.theme.themes.dark.primary"
                    >
                      <v-img
                        v-if="item.user.avatar"
                        :src="
                          $store.state.baseURL +
                          '/usercontent/' +
                          item.user.avatar
                        "
                      />
                      <v-icon v-else> mdi-account </v-icon>
                    </v-list-item-avatar>
                  </v-badge>
                  <template>
                    <v-list-item-content>
                      <v-list-item-title>
                        {{ getName(item.user) }}
                        <v-tooltip top v-if="item.user.admin">
                          <template v-slot:activator="{ on }">
                            <v-btn icon v-on="on" small>
                              <v-icon> mdi-crown </v-icon>
                            </v-btn>
                          </template>
                          <span>Colubrina Instance Administrator</span>
                        </v-tooltip>
                        <v-tooltip top v-if="item.user.bot">
                          <template v-slot:activator="{ on }">
                            <v-btn icon v-on="on" small>
                              <v-icon> mdi-robot </v-icon>
                            </v-btn>
                          </template>
                          <span>Bot</span>
                        </v-tooltip>
                        <v-tooltip top v-if="item.user.id < 35">
                          <template v-slot:activator="{ on }">
                            <v-btn icon v-on="on" small>
                              <v-icon> mdi-alpha-a-circle </v-icon>
                            </v-btn>
                          </template>
                          <span>Early User</span>
                        </v-tooltip>
                      </v-list-item-title>
                    </v-list-item-content>
                  </template>
                </v-list-item>
              </template>
            </v-list-item-group>
          </v-list>
          <br />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<script>
import AjaxErrorHandler from "@/lib/errorHandler"
import CommsInput from "@/components/CommsInput"
import NicknameDialog from "@/components/NicknameDialog"
import UserDialog from "@/components/UserDialog"
import Message from "@/components/Message"
import SimpleMessage from "@/components/SimpleMessage"

export default {
  name: "CommunicationsChat",
  components: {
    SimpleMessage,
    Message,
    UserDialog,
    NicknameDialog,
    CommsInput
  },
  props: ["chat", "loading", "items"],
  data: () => ({
    interval: null,
    pins: [],
    pinsLoading: true,
    reachedTop: false,
    graphOptions: {
      responsive: true,
      maintainAspectRatio: false,
      title: {
        display: false
      }
    },
    offset: null,
    nickname: {
      dialog: false,
      nickname: "",
      user: {}
    },
    context: {
      user: {
        value: false,
        x: null,
        y: null,
        item: null
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
    search: {
      query: "",
      results: [],
      pager: {
        totalPages: 1
      },
      loading: false,
      page: 1
    },
    preview: {
      dialog: false,
      src: "",
      height: 0,
      width: 0,
      name: ""
    },
    fileTypes: {
      png: "mdi-file-image",
      jpg: "mdi-file-image",
      jpeg: "mdi-file-image",
      gif: "mdi-file-image",
      mp4: "mdi-file-video",
      mp3: "mdi-file-music",
      pdf: "mdi-file-pdf",
      doc: "mdi-file-word",
      docx: "mdi-file-word",
      xls: "mdi-file-excel",
      xlsx: "mdi-file-excel",
      ppt: "mdi-file-powerpoint",
      pptx: "mdi-file-powerpoint",
      zip: "mdi-file-zip",
      rar: "mdi-file-zip",
      txt: "mdi-file-document",
      csv: "mdi-file-spreadsheet",
      html: "mdi-file-html",
      htm: "mdi-file-html",
      js: "mdi-file-code",
      json: "mdi-file-code",
      css: "mdi-file-css",
      otf: "mdi-file-font",
      ttf: "mdi-file-font",
      woff: "mdi-file-font",
      woff2: "mdi-file-font",
      otf2: "mdi-file-font",
      ttf2: "mdi-file-font",
      eot: "mdi-file-font",
      svg: "mdi-file-image",
      ico: "mdi-file-image",
      webp: "mdi-file-image",
      other: "mdi-file",
      xml: "mdi-file-code"
    },
    replying: null,
    emojiPicker: false,
    messages: [],
    typingDate: null,
    file: null,
    message: "",
    edit: {
      content: "",
      editing: false,
      id: null
    },
    usersTyping: [],
    blobURL: "",
    autoScrollRetry: 0,
    searchPanel: false,
    userPanel: true,
    rateLimit: false,
    loadingMessages: true,
    avoidAutoScroll: false,
    lastRead: 0
  }),
  computed: {
    offsetValue() {
      return this.offset || this.messages[0]?.id || 0
    },
    associations() {
      if (this.chat) {
        return this.chat.chat.associations.slice().sort((a, b) => {
          if (a.lastRead > b.lastRead) {
            return -1
          } else if (a.lastRead < b.lastRead) {
            return 1
          } else {
            return 0
          }
        })
      } else {
        console.log("Chat could not be found (associations)")
        return []
      }
    }
  },
  methods: {
    copy(content) {
      navigator.clipboard.writeText(content)
    },
    removePin(id) {
      this.axios
        .post(`/api/v1/communications/${this.chat.id}/pins`, {
          messageId: id
        })
        .then(() => {
          this.getPins()
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    getPins() {
      this.pinsLoading = true
      this.axios
        .get(
          process.env.VUE_APP_BASE_URL +
            "/api/v1/communications/" +
            this.$route.params.id +
            "/pins"
        )
        .then((res) => {
          this.pins = res.data
          this.pinsLoading = false
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    forceBottom() {
      this.avoidAutoScroll = false
      this.autoScroll()
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
    async scrollEvent(e) {
      this.avoidAutoScroll =
        e.target.scrollHeight -
          Math.round(e.target.scrollTop + e.target.offsetHeight) >
        50
      if (
        e.target.scrollTop === 0 &&
        !this.rateLimit &&
        !this.reachedTop &&
        !this.loadingMessages
      ) {
        this.rateLimit = true
        this.loadingMessages = true
        const element = document.getElementById("message-0")
        await this.getMessages()
        if (element) {
          element.scrollIntoView()
        }
        setTimeout(() => {
          this.rateLimit = false
        }, 250)
      }
    },
    setReply(message) {
      this.replying = message
    },
    markAsRead() {
      if (this.items) {
        try {
          const unread = this.$store.state.chats.find(
            (item) => item.id === JSON.parse(this.$route.params.id)
          ).unread
          this.items.find(
            (item) => item.id === JSON.parse(this.$route.params.id)
          ).unread = 0
          this.$store.state.communicationNotifications -= unread
        } catch {
          return
        }
      }
    },
    endSend() {
      this.replying = null
    },
    focusInput() {
      const input = document.getElementById("message-input")
      if (input) {
        input.focus()
      }
    },
    openUserPanel(user) {
      this.context.userPopout.item = user
      this.context.userPopout.value = true
    },
    getName(user) {
      if (user.nickname?.nickname) {
        return user.nickname.nickname
      } else {
        return user.username
      }
    },
    setFriendNickname() {
      this.axios
        .post(
          process.env.VUE_APP_BASE_URL +
            "/api/v1/communications/nickname/" +
            this.context.user.item.id,
          {
            nickname: this.nickname.nickname
          }
        )
        .then((res) => {
          this.context.user.value = false
          this.nickname.dialog = false
          this.nickname.nickname = ""
          this.nickname.user = {}
          this.$toast.success("Nickname changed successfully.")
          this.items.forEach((item) => {
            item.chat.associations.forEach((a) => {
              if (a.user.id === this.context.user.item.id) {
                a.user.nickname = {
                  nickname: res.data.nickname
                }
              }
            })
            item.chat.users.forEach((u) => {
              if (u.id === this.context.user.item.id) {
                u.nickname = {
                  nickname: res.data.nickname
                }
              }
            })
          })
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    show(e, context, item) {
      e.preventDefault()
      this.context[context].value = false
      this.context[context].x = e.clientX
      this.context[context].y = e.clientY
      this.context[context].item = item
      this.context[context].id = item.id
      this.$nextTick(() => {
        this.context[context].value = true
      })
    },
    getStatus(item) {
      if (item.status === "online") {
        return "green"
      } else if (item.status === "offline") {
        return "grey"
      } else if (item.status === "away") {
        return "orange"
      } else if (item.status === "busy") {
        return "red"
      } else {
        return "grey"
      }
    },
    doSearch() {
      if (this.search.query.length) {
        this.axios
          .get(
            process.env.VUE_APP_BASE_URL +
              "/api/v1/communications/" +
              this.$route.params.id +
              "/search",
            {
              params: {
                query: this.search.query,
                page: this.search.page
              }
            }
          )
          .then((res) => {
            this.search.results = res.data.messages
            this.search.pager = res.data.pager
          })
          .catch((e) => {
            AjaxErrorHandler(this.$store)(e)
          })
      }
    },
    setImagePreview(attachment) {
      const link = attachment.attachment
        ? this.$store.state.baseURL + "/usercontent/" + attachment.attachment
        : attachment.mediaProxyLink
      this.preview.src = link
      const img = new Image()
      img.onload = () => {
        this.preview.height = img.height
        this.preview.width = img.width
        this.preview.dialog = true
        this.preview.name = attachment.name
      }
      img.src = link
    },
    handleDrag(e) {
      if (e.dataTransfer.files.length) {
        this.file = e.dataTransfer.files[0]
      }
    },
    friendlySize(size) {
      if (size < 1024) {
        return size + " bytes"
      } else if (size < 1048576) {
        return (size / 1024).toFixed(2) + " KB"
      } else if (size < 1073741824) {
        return (size / 1048576).toFixed(2) + " MB"
      } else {
        return (size / 1073741824).toFixed(2) + " GB"
      }
    },
    deleteMessage(message) {
      this.axios
        .delete(
          process.env.VUE_APP_BASE_URL +
            "/api/v1/communications/" +
            this.$route.params.id +
            "/message/" +
            message.id
        )
        .then(() => {
          const index = this.messages.findIndex(
            (item) => item.id === message.id
          )
          if (index !== -1) {
            this.messages.splice(index, 1)
          }
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    async jumpToMessage(id) {
      try {
        console.log("Jumping to message", id)
        const index = this.messages.findIndex((message) => message.id === id)
        const lastMessage = document.querySelector(`#message-${index}`)
        if (lastMessage) {
          lastMessage.scrollIntoView({
            behavior: "smooth"
          })
          // indicate message by changing background color to a blue
          lastMessage.style.backgroundColor = "rgba(8,192,238,0.1)"
          // set opacity of background color to 0.5
          setTimeout(() => {
            lastMessage.style.backgroundColor = ""
          }, 1500)
        } else {
          this.offset = id + 10
          await this.getMessages()
          this.jumpToMessage(id)
          this.offset = null
        }
      } catch (e) {
        console.log(e)
        console.log("Could not auto scroll (Jump to message)")
      }
    },
    typing() {
      this.usersTyping = this.usersTyping.filter((user) => {
        return this.$date().isBefore(user.timeout)
      })
    },
    editLastMessage() {
      // find last message sent by current user
      const lastMessage = this.messages
        .slice()
        .reverse()
        .find((message) => message.userId === this.$store.state.user.id)
      if (lastMessage) {
        this.edit.content = lastMessage.content
        this.edit.editing = true
        this.edit.id = lastMessage.id
      }
    },
    endEdit() {
      this.edit.editing = false
      this.edit.content = ""
      this.edit.id = ""
      this.focusInput()
    },
    autoScroll(smooth = false) {
      this.$nextTick(() => {
        if (!this.avoidAutoScroll) {
          try {
            const lastIndex = this.messages.length - 1
            const lastMessage = document.querySelector(`#message-${lastIndex}`)
            if (smooth) {
              lastMessage.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "start"
              })
            } else {
              lastMessage.scrollIntoView()
            }
            this.autoScrollRetry = 0
          } catch (e) {
            console.log("Could not auto scroll, retrying...")
            if (this.autoScrollRetry < 20) {
              setTimeout(() => {
                this.autoScroll()
              }, 50)
              this.autoScrollRetry++
            } else {
              console.log("Could not auto scroll, retry limit reached")
            }
          }
        }
      })
    },
    async getMessages() {
      this.loadingMessages = true
      this.autoScroll()
      await this.axios
        .get(
          process.env.VUE_APP_BASE_URL +
            "/api/v1/communications/" +
            this.$route.params.id +
            "/messages?limit=50&offset=" +
            this.offsetValue
        )
        .then((res) => {
          if (!res.data.length) {
            this.reachedTop = true
          }
          this.messages.unshift(...res.data)
          /*     this.$store.commit("setMessages", {
            id: this.chat.id,
            messages: this.messages
          })*/
          this.loadingMessages = false
          this.markRead()
          this.$nextTick(() => {
            this.autoScroll()
          })
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    markRead() {
      this.axios.put(
        process.env.VUE_APP_BASE_URL +
          "/api/v1/communications/" +
          this.$route.params.id +
          "/read"
      )
      this.markAsRead()
    },
    focusKey() {
      if (document.activeElement.tagName === "BODY") {
        this.focusInput()
      }
    }
  },
  mounted() {
    document.addEventListener("keypress", this.focusKey)
    document
      .getElementById("message-list")
      .addEventListener("scroll", this.scrollEvent)
    this.interval = setInterval(() => {
      this.typing()
      if (
        document.hasFocus() &&
        this.messages[this.messages.length - 1]?.id !== this.lastRead
      ) {
        this.markRead()
      }
    }, 1000)
    this.getMessages()
    if (localStorage.getItem("userPanel")) {
      this.userPanel = JSON.parse(localStorage.getItem("userPanel"))
    } else {
      localStorage.setItem("userPanel", true)
    }
    let drafts = {}
    if (localStorage.getItem("drafts")) {
      drafts = JSON.parse(localStorage.getItem("drafts"))
    }
    if (drafts[this.$route.params.id]) {
      this.message = drafts[this.$route.params.id]
    }
    this.$socket.on("readChat", (data) => {
      if (data.id === this.chat.id) {
        this.lastRead = data.lastRead
      }
    })
    this.$socket.on("readReceipt", (data) => {
      if (
        data.messageId &&
        data.chatId === this.chat.chatId &&
        this.messages?.length
      ) {
        this.messages.forEach((message) => {
          message.readReceipts = message.readReceipts.filter(
            (readReceipt) => readReceipt.id !== data.id
          )
        })
        this.messages
          .find((message) => message.id === data.messageId)
          .readReceipts?.push(data)
        this.autoScroll()
      }
    })
    this.$socket.on("message", (message) => {
      if (message.chatId === this.chat.chatId) {
        this.messages.push(message)
        this.autoScroll()
        if (document.hasFocus()) {
          this.markRead()
        }
        if (this.messages.length > 50 && !this.avoidAutoScroll) {
          this.messages.shift()
          this.reachedTop = false
        }
      }
    })
    this.$socket.on("editMessage", (message) => {
      if (message.chatId === this.chat.chatId) {
        const index = this.messages.findIndex((item) => item.id === message.id)
        if (index !== -1) {
          this.messages[index].content = message.content
          this.messages[index].edited = message.edited
          this.messages[index].editedAt = message.editedAt
          this.messages[index].keyId = message.id + "-" + message.editedAt
        }
      }
    })
    this.$socket.on("messageEmbedResolved", (message) => {
      if (message.chatId === this.chat.chatId) {
        const index = this.messages.findIndex((item) => item.id === message.id)
        if (index !== -1) {
          this.messages[index].keyId = message.id + "-" + message.editedAt
          this.messages[index].embeds = message.embeds
          this.autoScroll()
        }
      }
    })
    this.$socket.on("typing", (event) => {
      if (event.chatId === this.chat.chatId) {
        const index = this.usersTyping.findIndex(
          (item) => item.userId === event.userId
        )
        if (index > -1) {
          this.usersTyping.splice(index, 1)
        }
        this.usersTyping.push(event)
      }
    })
    this.$socket.on("deleteMessage", (message) => {
      if (message.chatId === this.chat.chatId) {
        const index = this.messages.findIndex((item) => item.id === message.id)
        if (index !== -1) {
          this.messages.splice(index, 1)
        }
      }
    })
  },
  watch: {
    "$store.state.context.pins.value"(val) {
      if (val) {
        this.getPins()
      }
    },
    userPanel() {
      localStorage.setItem("userPanel", JSON.stringify(this.userPanel))
    },
    "$route.params.id"(val, oldVal) {
      this.focusInput()
      let drafts = {}
      if (localStorage.getItem("drafts")) {
        drafts = JSON.parse(localStorage.getItem("drafts"))
      }
      if (this.message || drafts[oldVal]) {
        drafts[oldVal] = this.message
        localStorage.setItem("drafts", JSON.stringify(drafts))
      } else if (!this.message && drafts[oldVal]) {
        drafts[oldVal] = ""
      }
      this.message = drafts[val] || ""
      this.usersTyping = []
      this.replying = null
      this.reachedTop = false
      this.avoidAutoScroll = false
      this.offset = null
      this.pins = []
      this.messages = []
      this.getMessages()
    }
  },
  destroyed() {
    document.removeEventListener("keypress", this.focusKey)
    document.removeEventListener("scroll", this.scrollEvent)
    clearInterval(this.interval)
  }
}
</script>
