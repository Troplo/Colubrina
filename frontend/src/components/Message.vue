<template>
  <div>
    <template>
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
              $store.state.baseURL + '/usercontent/' + message.reply.user.avatar
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
        :class="{
          'pa-0': $vuetify.breakpoint.mobile,
          'mentioned-message': mentioned
        }"
        class="message"
        :dense="lastMessage"
        :id="'message-' + index"
        @contextmenu="show($event, 'message', message)"
        :style="lastMessage ? 'margin-bottom: -5px; margin-top: -5px;' : ''"
      >
        <v-avatar
          size="45"
          class="mr-2"
          v-if="!lastMessage"
          :class="{ 'hide-on-hover': message.type }"
        >
          <v-img
            :src="$store.state.baseURL + '/usercontent/' + message.user.avatar"
            v-if="message.user.avatar && !message.type"
            class="elevation-1"
          />
          <v-icon class="elevation-1" v-else-if="!message.type">
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
          <template v-slot:activator="{ on }">
            <small
              v-on="on"
              style="font-size: 9px; position: absolute"
              class="grey--text message-date"
              v-if="lastMessage || message.type"
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
                {{ $date(message.editedAt).format("DD/MM/YYYY hh:mm:ss A") }}
              </span>
            </v-tooltip>
          </v-list-item-subtitle>
          <span v-if="edit.id !== message.id" style="overflow-wrap: anywhere">
            <span v-markdown>
              {{ message.content }}
            </span>
            <v-tooltip top v-if="message.edited && lastMessage">
              <template v-slot:activator="{ on }">
                <v-icon color="grey" small v-on="on" style="">
                  mdi-pencil
                </v-icon>
              </template>
              <span>
                {{ $date(message.editedAt).format("DD/MM/YYYY hh:mm:ss A") }}
              </span>
            </v-tooltip>
          </span>

          <template v-if="edit.id !== message.id">
            <v-row
              v-for="(embed, index) in message.embeds"
              :key="index"
              :id="'embed-' + index"
              no-gutters
            >
              <v-card
                :min-width="!$vuetify.breakpoint.mobile ? 400 : 0"
                elevation="0"
                color="card"
                v-if="embed.type === 'image'"
              >
                <v-hover v-slot="{ hover }">
                  <div>
                    <v-img
                      @click="setImagePreview(embed)"
                      contain
                      :max-width="500"
                      :max-height="500"
                      :min-height="250"
                      :min-width="250"
                      :src="$store.state.baseURL + embed.mediaProxyLink"
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
              </v-card>
              <v-card
                v-if="embed.type !== 'image'"
                elevation="0"
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
            <v-row v-if="message.poll" no-gutters>
              <v-card
                elevation="0"
                :max-width="500"
                :min-width="!$vuetify.breakpoint.mobile ? 400 : 200"
                class="ml-1 mb-1 mr-1 rounded-l"
                color="card lighten-1"
              >
                <v-toolbar color="toolbar" height="45">
                  <v-toolbar-title>
                    Poll: {{ message.poll.title }}
                  </v-toolbar-title>
                </v-toolbar>
                <v-card-text>
                  {{ message.poll.description }}
                  <v-progress-linear
                    v-for="option in message.poll.options"
                    :key="option.id"
                    block
                    class="mb-1 rounded-xl"
                    height="30"
                    text
                    :value="
                      percentageVotes.find(
                        (percentage) => percentage.id === option.id
                      ).percentage
                    "
                    color="success darken-1"
                    background-opacity="0.2"
                    outlined
                    style="text-transform: none; cursor: pointer"
                    @click="votePoll(option.id)"
                  >
                    <span style="float: left !important">
                      <v-icon v-if="option.id === myVote?.answer">
                        mdi-check-circle
                      </v-icon>
                      {{ option.value }} ({{
                        percentageVotes.find(
                          (percentage) => percentage.id === option.id
                        ).percentage
                      }}% /
                      {{
                        message.poll.answers.filter(
                          (answer) => answer.answer === option.id
                        )?.length || 0
                      }})
                    </span>
                  </v-progress-linear>
                  {{ message.poll.answers.length }} votes
                </v-card-text>
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
              elevation="0"
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
                    :max-width="500"
                    :max-height="500"
                    :src="
                      $store.state.baseURL +
                      '/usercontent/' +
                      attachment.attachment
                    "
                    :min-height="250"
                    :min-width="250"
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
            :edit="edit"
            :chat="chat"
            :auto-scroll="autoScroll"
            :end-edit="endEdit"
            v-if="edit.id === message.id"
          ></CommsInput>
        </v-list-item-content>
        <v-card
          elevation="8"
          color="card"
          class="message-action-card"
          v-if="!$vuetify.breakpoint.mobile"
        >
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <span v-on="on">
                <v-btn
                  icon
                  v-on="on"
                  v-if="
                    message.userId === $store.state.user.id ||
                    chat.rank === 'admin'
                  "
                  @click="deleteMessage(message)"
                >
                  <v-icon> mdi-delete </v-icon>
                </v-btn>
              </span>
            </template>
            <span> Delete </span>
          </v-tooltip>
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <span v-on="on">
                <v-btn
                  icon
                  v-on="on"
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
              </span>
            </template>
            <span> Edit </span>
          </v-tooltip>
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <span v-on="on">
                <v-btn
                  v-on="on"
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
              </span>
            </template>
            <span> Discard Edits </span>
          </v-tooltip>
          <v-tooltip top>
            <template v-slot:activator="{ on }">
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
            <template v-slot:activator="{ on }">
              <span v-on="on">
                <v-btn
                  v-on="on"
                  icon
                  v-if="chat.rank === 'admin' || chat.chat.type === 'direct'"
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
          <v-menu offset-y v-if="$store.state.site.release === 'dev'">
            <template v-slot:activator="{ on, attrs }">
              <v-btn v-on="on" icon v-bind="attrs">
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
    "deleteMessage",
    "lastMessage"
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
  computed: {
    myVote() {
      return this.message.poll.answers.find(
        (vote) => vote.userId === this.$store.state.user.id
      )
    },
    percentageVotes() {
      return this.message.poll.options.map((option) => {
        return {
          id: option.id,
          percentage: Math.round(
            ((this.message.poll.answers?.filter(
              (answer) => answer?.answer === option.id
            ).length || 0) /
              this.message.poll.answers.length) *
              100 || 0
          )
        }
      })
    },
    mentioned() {
      return this.message.content
        .toLowerCase()
        .includes(this.$store.state.user.username.toLowerCase())
    }
  },
  methods: {
    votePoll(option) {
      this.axios
        .post(`/api/v1/polls/${this.message.poll.id}/vote`, {
          option
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
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
  },
  mounted() {
    if (this.message.poll) {
      this.$socket.on(`pollAnswer-${this.message.id}`, (data) => {
        this.message.poll.answers = this.message.poll.answers.filter(
          (answer) => answer.id !== data.id
        )
        if (data.answer) {
          this.message.poll.answers.push(data.answer)
        }
      })
    }
  }
}
</script>

<style scoped></style>
