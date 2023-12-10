<template>
  <div>
    <template>
      <v-toolbar
        v-if="message.reply"
        :key="message.keyId + '-reply-toolbar'"
        elevation="0"
        height="40"
        color="card"
        style="cursor: pointer"
        @click="jumpToMessage(message.replyId)"
      >
        <v-icon class="mr-2"> mdi-reply </v-icon>
        <v-avatar size="24" class="mr-2">
          <v-img
            v-if="message.reply.user.avatar"
            :src="
              $store.state.baseURL + '/usercontent/' + message.reply.user.avatar
            "
            class="elevation-1"
          />
          <v-icon v-else class="elevation-1"> mdi-account </v-icon>
        </v-avatar>
        <template v-if="message.reply.attachments.length">
          <v-icon class="mr-2"> mdi-file-image </v-icon>
        </template>
        <template
          v-if="!message.reply.content && message.reply.attachments.length"
        >
          Click to view attachment
        </template>
        {{ message.reply.content.substring(0, 100) }}
      </v-toolbar>
      <v-list-item
        :id="'message-' + index"
        :key="message.keyId"
        :class="{
          'pa-0': $vuetify.breakpoint.mobile,
          'mentioned-message': mentioned
        }"
        class="message"
        :dense="lastMessage"
        :style="lastMessage ? 'margin-bottom: -5px; margin-top: -5px;' : ''"
        @contextmenu="show($event, 'message', message)"
      >
        <v-avatar
          v-if="!lastMessage"
          size="45"
          class="mr-2"
          :class="{ 'hide-on-hover': message.type }"
        >
          <v-img
            v-if="message.user.avatar && !message.type"
            :src="$store.state.baseURL + '/usercontent/' + message.user.avatar"
            class="elevation-1"
          />
          <v-icon v-else-if="!message.type" class="elevation-1">
            mdi-account
          </v-icon>
          <v-icon
            v-else-if="message.type === 'leave'"
            color="red"
            class="mr-2 ml-1"
            size="32"
          >
            mdi-arrow-left
          </v-icon>
          <v-icon
            v-else-if="message.type === 'join'"
            size="32"
            color="success"
            class="mr-2 ml-1"
          >
            mdi-arrow-right
          </v-icon>
          <v-icon
            v-else-if="message.type === 'pin'"
            size="32"
            color="grey"
            class="mr-2 ml-1"
          >
            mdi-pin-outline
          </v-icon>
          <v-icon v-else size="32" color="grey" class="mr-2 ml-1">
            mdi-pencil
          </v-icon>
        </v-avatar>
        <v-tooltip top style="z-index: 15">
          <template #activator="{ on }">
            <small
              v-if="lastMessage || message.type"
              style="font-size: 9px; position: absolute"
              class="grey--text message-date"
              v-on="on"
            >
              {{ $date(message.createdAt).format("hh:mm A") }}
            </small>
          </template>
          <span>
            {{
              $date(message.createdAt).format("DD/MM/YYYY, hh:mm:ss A")
            }}</span
          >
        </v-tooltip>
        <v-list-item-content :class="{ 'offset-message': lastMessage }">
          <v-list-item-subtitle v-if="!lastMessage && !message.type">
            {{ getName(message.user) }}
            <v-chip
              v-if="message.user.bot"
              color="calendarNormalActivity"
              small
            >
              <v-icon small> mdi-robot </v-icon>&nbsp;
            </v-chip>
            <small>
              {{ $date(message.createdAt).format("hh:mm A, DD/MM/YYYY") }}
            </small>
            <v-tooltip v-if="message.edited" top>
              <template #activator="{ on, attrs }">
                <span v-bind="attrs" v-on="on">
                  <v-icon
                    color="grey"
                    small
                    style="
                      margin-bottom: 2px;
                      margin-left: 4px;
                      position: absolute;
                    "
                  >
                    mdi-pencil
                  </v-icon>
                </span>
              </template>
              <span>
                {{ $date(message.editedAt).format("DD/MM/YYYY hh:mm:ss A") }}
              </span>
            </v-tooltip>
          </v-list-item-subtitle>
          <span v-if="edit.id !== message.id" style="overflow-wrap: anywhere">
            <span v-markdown>
              {{ message.content }}
            </span>
            <v-tooltip v-if="message.edited && lastMessage" top>
              <template #activator="{ on }">
                <v-icon color="grey" small style="" v-on="on">
                  mdi-pencil
                </v-icon>
              </template>
              <span>
                {{ $date(message.editedAt).format("DD/MM/YYYY hh:mm:ss A") }}
              </span>
            </v-tooltip>
          </span>

          <template v-if="edit.id !== message.id">
            <Embed
              v-for="(embed, index) in message.embeds"
              :id="'embed-' + index"
              :key="index"
              :embed="embed"
              :set-image-preview="setImagePreview"
            />
            <v-row v-if="message.poll" no-gutters>
              <Poll :message="message" />
            </v-row>
          </template>
          <template v-if="edit.id !== message.id">
            <v-card
              v-for="(attachment, index) in message.attachments"
              :id="'attachment-' + index"
              :key="attachment.id"
              :max-width="500"
              :min-width="!$vuetify.breakpoint.mobile ? 400 : 0"
              elevation="0"
              color="card"
            >
              <v-hover
                v-if="
                  attachment.extension === 'jpg' ||
                  attachment.extension === 'png' ||
                  attachment.extension === 'jpeg' ||
                  attachment.extension === 'gif'
                "
                v-slot="{ hover }"
              >
                <div>
                  <v-img
                    contain
                    :max-width="500"
                    :max-height="500"
                    :src="
                      $store.state.baseURL +
                      '/usercontent/' +
                      attachment.attachment
                    "
                    :min-height="250"
                    :min-width="250"
                    @click="setImagePreview(attachment)"
                  >
                    <template #placeholder>
                      <v-row
                        class="fill-height ma-0"
                        align="center"
                        justify="center"
                      >
                        <v-progress-circular
                          indeterminate
                          color="grey lighten-5"
                        />
                      </v-row>
                    </template>
                    <template #default>
                      <v-fade-transition v-if="hover">
                        <v-overlay absolute>
                          <v-icon large> mdi-arrow-expand-all </v-icon>
                        </v-overlay>
                      </v-fade-transition>
                    </template>
                  </v-img>
                </div>
              </v-hover>
              <v-card-text v-else>
                <v-icon class="mr-2" :size="48">
                  {{ fileTypes[attachment.extension] || "mdi-file" }}
                </v-icon>
                <span>
                  {{ attachment.name }}
                </span>
              </v-card-text>
              <v-card-actions
                v-if="
                  attachment.extension !== 'jpg' &&
                  attachment.extension !== 'png' &&
                  attachment.extension !== 'jpeg' &&
                  attachment.extension !== 'gif'
                "
              >
                {{ attachment.name }} -
                {{ friendlySize(attachment.size) }}
                <v-spacer />
                <v-btn
                  text
                  icon
                  :href="
                    $store.state.baseURL +
                    '/usercontent/' +
                    attachment.attachment
                  "
                  target="_blank"
                >
                  <v-icon> mdi-download </v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
          <CommsInput
            v-if="edit.id === message.id"
            :edit="edit"
            :chat="chat"
            :auto-scroll="autoScroll"
            :end-edit="endEdit"
          />
        </v-list-item-content>
        <v-card
          v-if="!$vuetify.breakpoint.mobile"
          elevation="8"
          color="card"
          class="message-action-card"
        >
          <v-tooltip top>
            <template #activator="{ on }">
              <span v-on="on">
                <v-btn
                  v-if="
                    message.userId === $store.state.user.id ||
                    chat.rank === 'admin'
                  "
                  icon
                  v-on="on"
                  @click="deleteMessage(message)"
                >
                  <v-icon> mdi-delete </v-icon>
                </v-btn>
              </span>
            </template>
            <span> Delete </span>
          </v-tooltip>
          <v-tooltip top>
            <template #activator="{ on }">
              <span v-on="on">
                <v-btn
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id !== message.id
                  "
                  icon
                  v-on="on"
                  @click="
                    edit.content = message.content
                    edit.editing = true
                    edit.id = message.id
                  "
                >
                  <v-icon> mdi-pencil </v-icon>
                </v-btn>
              </span>
            </template>
            <span> Edit </span>
          </v-tooltip>
          <v-tooltip top>
            <template #activator="{ on }">
              <span v-on="on">
                <v-btn
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id === message.id
                  "
                  icon
                  v-on="on"
                  @click="
                    edit.content = ''
                    edit.editing = false
                    edit.id = null
                  "
                >
                  <v-icon> mdi-close </v-icon>
                </v-btn>
              </span>
            </template>
            <span> Discard Edits </span>
          </v-tooltip>
          <v-tooltip top>
            <template #activator="{ on }">
              <span v-on="on">
                <v-btn
                  icon
                  @click="
                    replying(message)
                    focusInput()
                  "
                  v-on="on"
                >
                  <v-icon> mdi-reply </v-icon>
                </v-btn>
              </span>
            </template>
            <span> Reply </span>
          </v-tooltip>
          <v-tooltip top>
            <template #activator="{ on }">
              <span v-on="on">
                <v-btn
                  v-if="chat.rank === 'admin' || chat.chat.type === 'direct'"
                  icon
                  v-on="on"
                  @click="
                    pinMessage()
                    focusInput()
                  "
                >
                  <v-icon> mdi-pin </v-icon>
                </v-btn>
              </span>
            </template>
            <span> Pin to Chat </span>
          </v-tooltip>
          <v-menu v-if="$store.state.site.release === 'dev'" offset-y>
            <template #activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" v-on="on">
                <v-icon> mdi-dots-horizontal </v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item><v-icon>mdi-delete</v-icon> Delete </v-list-item>
            </v-list>
          </v-menu>
        </v-card>
      </v-list-item>
    </template>
  </div>
</template>

<script>
import Embed from "./Embed.vue"
import CommsInput from "./CommsInput.vue"
import AjaxErrorHandler from "@/lib/errorHandler.js"
import Poll from "@/components/Poll"

export default {
  name: "Message",
  components: {
    Poll,
    CommsInput,
    Embed
  },
  props: [
    "message",
    "edit",
    "jumpToMessage",
    "focusInput",
    "replying",
    "getName",
    "chat",
    "endEdit",
    "autoScroll",
    "index",
    "show",
    "setImagePreview",
    "deleteMessage",
    "lastMessage"
  ],
  data() {
    return {
      graphOptions: {
        responsive: true,
        maintainAspectRatio: false,
        title: {
          display: false
        }
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
      }
    }
  },
  computed: {
    mentioned() {
      return this.message.content
        .toLowerCase()
        .includes(this.$store.state.user.username.toLowerCase())
    }
  },
  methods: {
    pinMessage() {
      this.axios
        .post(`/api/v1/communications/${this.chat.id}/pins`, {
          messageId: this.message.id
        })
        .then((res) => {
          this.$toast.success(res.data.message)
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
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
    }
  }
}
</script>

<style scoped></style>
