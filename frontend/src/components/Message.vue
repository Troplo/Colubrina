<template>
  <div>
    <v-hover v-slot="{ hover }">
      <div>
        <template v-if="!message.type">
          <v-toolbar
            @click="jumpToMessage(message.replyId)"
            :key="message.keyId + '-reply-toolbar'"
            elevation="0"
            height="40"
            color="card"
            v-if="message.reply"
            style="cursor: pointer"
          >
            <v-icon class="mr-2">mdi-reply</v-icon>
            <v-avatar size="24" class="mr-2">
              <v-img
                :src="
                  $store.state.baseURL +
                  '/usercontent/' +
                  message.reply.user.avatar
                "
                v-if="message.reply.user.avatar"
                class="elevation-1"
              />
              <v-icon v-else class="elevation-1"> mdi-account </v-icon>
            </v-avatar>
            <template v-if="message.reply.attachments.length">
              <v-icon class="mr-2">mdi-file-image</v-icon>
            </template>
            <template
              v-if="!message.reply.content && message.reply.attachments.length"
            >
              Click to view attachment
            </template>
            {{ message.reply.content.substring(0, 100) }}
          </v-toolbar>
          <v-list-item
            :key="message.keyId"
            :class="{ 'message-hover': hover }"
            :id="'message-' + index"
            @contextmenu="show($event, 'message', message)"
          >
            <v-avatar size="48" class="mr-2">
              <v-img
                :src="
                  $store.state.baseURL + '/usercontent/' + message.user.avatar
                "
                v-if="message.user.avatar"
                class="elevation-1"
              />
              <v-icon v-else class="elevation-1"> mdi-account </v-icon>
            </v-avatar>
            <v-list-item-content>
              <v-list-item-subtitle>
                {{ getName(message.user) }}
                <v-chip
                  v-if="message.user.bot"
                  color="calendarNormalActivity"
                  small
                >
                  <v-icon small>mdi-robot</v-icon>&nbsp;
                </v-chip>
                <small>
                  {{ $date(message.createdAt).format("hh:mm A, DD/MM/YYYY") }}
                </small>
                <v-tooltip top v-if="message.edited">
                  <template v-slot:activator="{ on, attrs }">
                    <span v-on="on" v-bind="attrs">
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
                    {{
                      $date(message.editedAt).format("DD/MM/YYYY hh:mm:ss A")
                    }}
                  </span>
                </v-tooltip>
              </v-list-item-subtitle>
              <p
                v-if="edit.id !== message.id"
                v-markdown
                style="overflow-wrap: anywhere"
              >
                {{ message.content }}
              </p>
              <template v-if="edit.id !== message.id">
                <v-row
                  v-for="(embed, index) in message.embeds"
                  :key="index"
                  :id="'embed-' + index"
                  no-gutters
                >
                  <v-card
                    elevaion="0"
                    :color="
                      embed.type === 'embed-v1' ? embed.backgroundColor : 'bg'
                    "
                    :max-width="400"
                    :min-width="!$vuetify.breakpoint.mobile ? 300 : 0"
                    class="ml-1 rounded-xl mb-1 mr-1"
                  >
                    <v-container fluid>
                      <v-row v-if="embed.type === 'openGraph'">
                        <v-col
                          cols="12"
                          class="text-xs-center"
                          v-if="embed.openGraph.ogImage"
                        >
                          <v-img
                            :src="
                              embed.openGraph.ogImage?.url ||
                              embed.openGraph.ogImage[0]?.url
                            "
                            class="elevation-1"
                            contain
                            :aspect-ratio="16 / 9"
                          >
                            <template v-slot:placeholder>
                              <v-row
                                class="fill-height ma-0"
                                align="center"
                                justify="center"
                              >
                                <v-progress-circular
                                  indeterminate
                                  color="grey lighten-5"
                                ></v-progress-circular>
                              </v-row>
                            </template>
                          </v-img>
                        </v-col>
                        <v-col cols="12" class="text-xs-center">
                          <h4>
                            {{ embed.openGraph.ogSiteName }}
                          </h4>
                          <a
                            :href="embed.link"
                            target="_blank"
                            style="text-decoration: none"
                          >
                            <h3>
                              {{ embed.openGraph.ogTitle }}
                            </h3>
                          </a>
                          <p v-if="embed.openGraph.ogDescription">
                            {{ embed.openGraph.ogDescription }}
                          </p>
                        </v-col>
                      </v-row>
                      <template v-else-if="embed.type === 'image'">
                        <v-hover v-slot="{ hover }">
                          <v-img
                            @click="setImagePreview(embed)"
                            contain
                            :aspect-ratio="16 / 9"
                            :src="embed.mediaProxyLink"
                          >
                            <template v-slot:placeholder>
                              <v-row
                                class="fill-height ma-0"
                                align="center"
                                justify="center"
                              >
                                <v-progress-circular
                                  indeterminate
                                  color="grey lighten-5"
                                ></v-progress-circular>
                              </v-row>
                            </template>
                            <template v-slot:default>
                              <v-fade-transition v-if="hover">
                                <v-overlay absolute>
                                  <v-icon large>mdi-arrow-expand-all</v-icon>
                                </v-overlay>
                              </v-fade-transition>
                            </template>
                          </v-img>
                        </v-hover>
                      </template>
                      <v-row v-else-if="embed.type === 'embed-v1'">
                        <v-col
                          cols="12"
                          class="text-xs-center"
                          v-if="embed.headerImage"
                        >
                          <v-img
                            :src="
                              embed.openGraph.headerImage?.url ||
                              embed.openGraph.headerImage[0]?.url
                            "
                            class="elevation-1"
                            contain
                            :aspect-ratio="16 / 9"
                          >
                            <template v-slot:placeholder>
                              <v-row
                                class="fill-height ma-0"
                                align="center"
                                justify="center"
                              >
                                <v-progress-circular
                                  indeterminate
                                  color="grey lighten-5"
                                ></v-progress-circular>
                              </v-row>
                            </template>
                          </v-img>
                        </v-col>
                        <v-col cols="12" class="text-xs-center">
                          <h4 v-if="embed.title">
                            {{ embed.title }}
                          </h4>
                          <p v-if="embed.description">
                            {{ embed.description }}
                          </p>
                          <v-row
                            v-for="(graph, index) in embed.graphs"
                            :key="'graph-' + index"
                          >
                            <v-col cols="12" class="text-xs-center">
                              <h3>
                                {{ graph.name }}
                              </h3>
                              <Chart
                                :chart-data="graph.data"
                                v-if="graph.data"
                                :options="graphOptions"
                              ></Chart>
                              <p v-else>Chart data could not be loaded.</p>
                            </v-col>
                          </v-row>
                          <v-row
                            v-for="(field, index) in embed.fields"
                            :key="'field-' + index"
                            :id="'field-' + index"
                            class="mt-1"
                          >
                            <v-col
                              cols="12"
                              class="text-xs-center"
                              style="white-space: pre-wrap"
                            >
                              <h4>{{ field.name }}</h4>
                              <p>{{ field.value }}</p>
                            </v-col>
                          </v-row>
                          <a
                            :href="embed.link.url"
                            v-if="embed.link"
                            target="_blank"
                            style="text-decoration: none"
                          >
                            <h3>
                              {{ embed.link.title }}
                            </h3>
                          </a>
                          <small v-if="embed.footer">
                            {{ embed.footer }}
                          </small>
                        </v-col>
                      </v-row>
                      <v-row v-else>
                        <v-container>
                          <h4>You must update Colubrina to see this embed.</h4>
                        </v-container>
                      </v-row>
                    </v-container>
                  </v-card>
                </v-row>
              </template>
              <template v-if="edit.id !== message.id">
                <v-card
                  v-for="(attachment, index) in message.attachments"
                  :key="attachment.id"
                  :id="'attachment-' + index"
                  :max-width="500"
                  :min-width="!$vuetify.breakpoint.mobile ? 400 : 0"
                  elevaion="0"
                  color="card"
                >
                  <v-hover
                    v-slot="{ hover }"
                    v-if="
                      attachment.extension === 'jpg' ||
                      attachment.extension === 'png' ||
                      attachment.extension === 'jpeg' ||
                      attachment.extension === 'gif'
                    "
                  >
                    <div>
                      <v-img
                        @click="setImagePreview(attachment)"
                        contain
                        :aspect-ratio="16 / 9"
                        :src="
                          $store.state.baseURL +
                          '/usercontent/' +
                          attachment.attachment
                        "
                      >
                        <template v-slot:placeholder>
                          <v-row
                            class="fill-height ma-0"
                            align="center"
                            justify="center"
                          >
                            <v-progress-circular
                              indeterminate
                              color="grey lighten-5"
                            ></v-progress-circular>
                          </v-row>
                        </template>
                        <template v-slot:default>
                          <v-fade-transition v-if="hover">
                            <v-overlay absolute>
                              <v-icon large>mdi-arrow-expand-all</v-icon>
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
                  <v-card-actions>
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
                :edit="edit"
                :chat="chat"
                :auto-scroll="autoScroll"
                :end-edit="endEdit"
                v-if="edit.id === message.id"
              ></CommsInput>
            </v-list-item-content>
            <v-list-item-action v-if="!$vuetify.breakpoint.mobile && hover">
              <v-list-item-subtitle>
                <v-btn
                  icon
                  v-if="message.userId === $store.state.user.id"
                  @click="deleteMessage(message)"
                >
                  <v-icon> mdi-delete </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    edit.content = message.content
                    edit.editing = true
                    edit.id = message.id
                  "
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id !== message.id
                  "
                >
                  <v-icon> mdi-pencil </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    edit.content = ''
                    edit.editing = false
                    edit.id = null
                  "
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id === message.id
                  "
                >
                  <v-icon> mdi-close </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    replying(message)
                    focusInput()
                  "
                >
                  <v-icon> mdi-reply </v-icon>
                </v-btn>
                <v-btn
                  icon
                  v-if="chat.rank === 'admin' || chat.chat.type === 'direct'"
                  @click="
                    pinMessage()
                    focusInput()
                  "
                >
                  <v-icon> mdi-pin </v-icon>
                </v-btn>
              </v-list-item-subtitle>
            </v-list-item-action>
          </v-list-item>
        </template>
        <template v-else-if="message.type === 'leave'">
          <v-list-item :key="message.keyId" :id="'message-' + index">
            <v-icon color="red" class="mr-2 ml-1"> mdi-arrow-left </v-icon>
            <v-list-item-content>
              {{ message.content }}
            </v-list-item-content>
            <v-list-item-action>
              <v-list-item-subtitle>
                {{ $date(message.createdAt).format("DD/MM/YYYY hh:mm A") }}
              </v-list-item-subtitle>
              <v-list-item-subtitle>
                <v-btn
                  icon
                  v-if="message.userId === $store.state.user.id"
                  @click="deleteMessage(message)"
                >
                  <v-icon> mdi-delete </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    edit.content = message.content
                    edit.editing = true
                    edit.id = message.id
                  "
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id !== message.id
                  "
                >
                  <v-icon> mdi-pencil </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    edit.content = ''
                    edit.editing = false
                    edit.id = null
                  "
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id === message.id
                  "
                >
                  <v-icon> mdi-close </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    replying(message)
                    focusInput()
                  "
                >
                  <v-icon> mdi-reply </v-icon>
                </v-btn>
              </v-list-item-subtitle>
            </v-list-item-action>
          </v-list-item>
        </template>
        <template v-else-if="message.type === 'join'">
          <v-list-item :key="message.keyId" :id="'message-' + index">
            <v-icon color="success" class="mr-2 ml-1"> mdi-arrow-right </v-icon>
            <v-list-item-content>
              {{ message.content }}
            </v-list-item-content>
            <v-list-item-action>
              <v-list-item-subtitle>
                {{ $date(message.createdAt).format("DD/MM/YYYY hh:mm A") }}
              </v-list-item-subtitle>
              <v-list-item-subtitle>
                <v-btn
                  icon
                  v-if="message.userId === $store.state.user.id"
                  @click="deleteMessage(message)"
                >
                  <v-icon> mdi-delete </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    edit.content = message.content
                    edit.editing = true
                    edit.id = message.id
                  "
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id !== message.id
                  "
                >
                  <v-icon> mdi-pencil </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    edit.content = ''
                    edit.editing = false
                    edit.id = null
                  "
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id === message.id
                  "
                >
                  <v-icon> mdi-close </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    replying(message)
                    focusInput()
                  "
                >
                  <v-icon> mdi-reply </v-icon>
                </v-btn>
              </v-list-item-subtitle>
            </v-list-item-action>
          </v-list-item>
        </template>
        <template v-else-if="message.type === 'rename'">
          <v-list-item :key="message.keyId" :id="'message-' + index">
            <v-icon color="grey" class="mr-2 ml-1"> mdi-pencil </v-icon>
            <v-list-item-content>
              {{ message.content }}
            </v-list-item-content>
            <v-list-item-action>
              <v-list-item-subtitle>
                {{ $date(message.createdAt).format("DD/MM/YYYY hh:mm A") }}
              </v-list-item-subtitle>
              <v-list-item-subtitle>
                <v-btn
                  icon
                  v-if="message.userId === $store.state.user.id"
                  @click="deleteMessage(message)"
                >
                  <v-icon> mdi-delete </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    edit.content = message.content
                    edit.editing = true
                    edit.id = message.id
                  "
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id !== message.id
                  "
                >
                  <v-icon> mdi-pencil </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    edit.content = ''
                    edit.editing = false
                    edit.id = null
                  "
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id === message.id
                  "
                >
                  <v-icon> mdi-close </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    replying(message)
                    focusInput()
                  "
                >
                  <v-icon> mdi-reply </v-icon>
                </v-btn>
              </v-list-item-subtitle>
            </v-list-item-action>
          </v-list-item>
        </template>
        <template v-else-if="message.type === 'pin'">
          <v-list-item :key="message.keyId" :id="'message-' + index">
            <v-icon color="grey" class="mr-2 ml-1"> mdi-pin-outline </v-icon>
            <v-list-item-content>
              {{ message.content }}
            </v-list-item-content>
            <v-list-item-action>
              <v-list-item-subtitle>
                {{ $date(message.createdAt).format("DD/MM/YYYY hh:mm A") }}
              </v-list-item-subtitle>
              <v-list-item-subtitle>
                <v-btn
                  icon
                  v-if="message.userId === $store.state.user.id"
                  @click="deleteMessage(message)"
                >
                  <v-icon> mdi-delete </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    edit.content = message.content
                    edit.editing = true
                    edit.id = message.id
                  "
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id !== message.id
                  "
                >
                  <v-icon> mdi-pencil </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    edit.content = ''
                    edit.editing = false
                    edit.id = null
                  "
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id === message.id
                  "
                >
                  <v-icon> mdi-close </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    replying(message)
                    focusInput()
                  "
                >
                  <v-icon> mdi-reply </v-icon>
                </v-btn>
              </v-list-item-subtitle>
            </v-list-item-action>
          </v-list-item>
        </template>
        <template v-else>
          <v-list-item :key="message.keyId" :id="'message-' + index">
            <v-icon color="grey" class="mr-2 ml-1"> mdi-pencil </v-icon>
            <v-list-item-content>
              {{ message.content }}
            </v-list-item-content>
            <v-list-item-action>
              <v-list-item-subtitle>
                {{ $date(message.createdAt).format("DD/MM/YYYY hh:mm A") }}
              </v-list-item-subtitle>
              <v-list-item-subtitle>
                <v-btn
                  icon
                  v-if="message.userId === $store.state.user.id"
                  @click="deleteMessage(message)"
                >
                  <v-icon> mdi-delete </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    edit.content = message.content
                    edit.editing = true
                    edit.id = message.id
                  "
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id !== message.id
                  "
                >
                  <v-icon> mdi-pencil </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    edit.content = ''
                    edit.editing = false
                    edit.id = null
                  "
                  v-if="
                    message.userId === $store.state.user.id &&
                    edit.id === message.id
                  "
                >
                  <v-icon> mdi-close </v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="
                    replying(message)
                    focusInput()
                  "
                >
                  <v-icon> mdi-reply </v-icon>
                </v-btn>
              </v-list-item-subtitle>
            </v-list-item-action>
          </v-list-item>
        </template>
      </div>
    </v-hover>
  </div>
</template>

<script>
import CommsInput from "./CommsInput.vue"
import { Line as Chart } from "vue-chartjs/legacy"
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from "chart.js"
import AjaxErrorHandler from "@/lib/errorHandler"
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
)
export default {
  name: "Message",
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
    "deleteMessage"
  ],
  components: {
    CommsInput,
    Chart
  },
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
