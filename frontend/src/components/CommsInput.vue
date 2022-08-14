<template>
  <div>
    <v-dialog v-model="poll.dialog" max-width="500">
      <v-card class="mb-0" color="card">
        <v-toolbar color="toolbar">
          <v-toolbar-title> Poll </v-toolbar-title>
        </v-toolbar>
        <v-card-text>
          <v-container fluid>
            <v-text-field v-model="poll.title" label="Title"></v-text-field>
            <v-textarea
              v-model="poll.description"
              label="Description"
            ></v-textarea>
            <v-text-field
              v-for="(value, index) in poll.options"
              :key="index"
              v-model="poll.options[index]"
              :label="`Option ${index + 1}`"
              :maxlength="30"
              :append-outer-icon="poll.options.length > 2 ? 'mdi-close' : ''"
              @click:append-outer="poll.options.splice(index, 1)"
            ></v-text-field>
            <v-btn
              @click="poll.options.push('')"
              v-if="poll.options.length <= 3"
              text
              block
            >
              <v-icon> mdi-plus </v-icon>
            </v-btn>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red" text @click="poll.dialog = false"> Cancel </v-btn>
          <v-btn
            color="blue darken-1"
            text
            @click="
              createPoll()
              poll.dialog = false
            "
          >
            Add to message
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-toolbar
      elevation="0"
      outlined
      height="40"
      color="card"
      v-for="(embed, index) in embeds"
      style="cursor: pointer; overflow: hidden"
      class="mb-2"
      :key="index"
    >
      <v-toolbar-title>
        <v-icon> mdi-attachment </v-icon>
        {{ embedName(embed.type) }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="embeds.splice(index, 1)" small>
        <v-icon> mdi-close </v-icon>
      </v-btn>
    </v-toolbar>
    <v-progress-linear
      v-model="uploadPercentage"
      v-if="uploading"
      height="15"
      color="toolbar"
      disabled
      class="rounded-xl"
    >
      <small>{{ uploadPercentage }}%</small>
    </v-progress-linear>
    <v-toolbar
      elevation="0"
      outlined
      height="40"
      color="card"
      v-if="file"
      style="cursor: pointer; overflow: hidden"
      class="mb-2"
    >
      <v-toolbar-title>
        <v-icon> mdi-attachment </v-icon>
        {{ file.name }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="file = null" small>
        <v-icon> mdi-close </v-icon>
      </v-btn>
    </v-toolbar>
    <v-textarea
      :style="
        !$vuetify.breakpoint.mobile
          ? 'margin-bottom: 5px'
          : 'margin-bottom: 0px'
      "
      autofocus
      label="Type a message"
      placeholder="Keep it civil"
      type="text"
      ref="message-input"
      :id="edit ? 'edit-input' : 'message-input'"
      outlined
      append-outer-icon="mdi-send"
      auto-grow
      @keyup.up="handleEditMessage"
      @keyup.esc="handleEsc"
      @click:append-outer="handleMessage()"
      @keydown.enter.exact.prevent="handleMessage()"
      @keydown.tab.exact.prevent="tabCompletion()"
      @input="
        completions = []
        completionWord = ''
      "
      v-model="message"
      @paste="handlePaste"
      rows="1"
      single-line
      dense
      hide-details
      @keydown.enter.shift.exact.prevent="newLine($event)"
    >
      <template v-slot:append-outer>
        <v-btn
          icon
          small
          @click="handleMessage()"
          v-if="!edit"
          :retain-focus-on-click="false"
          class="no-focus"
        >
          <v-icon> mdi-send </v-icon>
        </v-btn>
      </template>
      <template v-slot:prepend-inner>
        <v-menu
          :nudge-top="10"
          :nudge-left="5"
          :close-delay="100"
          :close-on-content-click="false"
          bottom
          offset-y
          top
        >
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              id="attachment-button"
              icon
              style="margin-top: -3px; margin-left: -4px"
              small
              @dblclick.stop="openFileInput"
            >
              <v-icon>mdi-plus-circle</v-icon>
            </v-btn>
          </template>
          <div>
            <v-list>
              <v-list-item @click="poll.dialog = true">
                <v-icon class="mr-2"> mdi-poll </v-icon>
                Create a poll
              </v-list-item>
              <v-list-item @click="openFileInput">
                <v-file-input
                  style="margin-top: -10px"
                  single-line
                  hide-input
                  v-model="file"
                  @change="getURLForImage"
                  v-if="!edit"
                  ref="file-input"
                  st
                ></v-file-input>
                Upload a file
              </v-list-item>
            </v-list>
          </div>
        </v-menu>
        <v-menu
          :nudge-top="10"
          :nudge-left="5"
          :close-delay="100"
          :close-on-content-click="false"
          bottom
          offset-y
          top
          v-if="false"
        >
          <template v-slot:activator="{ on }">
            <v-btn
              id="emoji-button"
              icon
              v-on="on"
              style="
                margin-top: -2px;
                margin-left: 1px;
                filter: grayscale(100%);
              "
              small
              @dblclick.stop="openFileInput"
            >
              <img
                style="width: 1.65em; height: 1.65em"
                class="emoji"
                draggable="false"
                alt="😀"
                src="https://twemoji.maxcdn.com/v/14.0.2/svg/1f600.svg"
              />
            </v-btn>
          </template>
          <v-card width="300" height="300">
            <v-tabs vertical height="300">
              <v-tab v-for="category in categories" :key="category">
                {{ category }}
              </v-tab>
              <v-tab-item
                v-for="category in categories"
                :key="category + '-item'"
              >
                <v-card height="300">
                  <v-container fluid>
                    <v-row>
                      <v-col
                        v-for="emoji in emojisByCategory[category]"
                        :key="emoji.emoji"
                        sm="4"
                        v-html="twemoji(emoji.emoji)"
                        @click="addEmoji(emoji.emoji)"
                        style="cursor: pointer"
                      >
                      </v-col>
                    </v-row>
                  </v-container>
                </v-card>
              </v-tab-item>
            </v-tabs>
          </v-card>
        </v-menu>
      </template>
    </v-textarea>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler"
import twemoji from "twemoji"
const emojis = require("../lib/emojis.json")

export default {
  name: "CommsInput",
  props: {
    replying: {
      type: Object,
      default: null
    },
    edit: {
      type: Object,
      default: null
    },
    autoScroll: {
      type: Function,
      default: () => {}
    },
    editLastMessage: {
      type: Function,
      default: () => {}
    },
    endEdit: {
      type: Function,
      default: () => {}
    },
    endSend: {
      type: Function,
      default: () => {}
    },
    chat: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      uploadPercentage: 0,
      uploading: false,
      poll: {
        dialog: false,
        title: "",
        options: ["", ""],
        description: ""
      },
      message: "",
      embeds: [],
      file: null,
      blobURL: null,
      mentions: false,
      users: [],
      completions: [],
      completionWord: ""
    }
  },
  /*
  computed: {
    emojis() {
      return emojis
    },
    categories() {
      return this.emojis
        .map((emoji) => emoji.category)
        .filter((category, index, array) => {
          return array.indexOf(category) === index
        })
    },
    emojisByCategory() {
      return this.categories.reduce((acc, category) => {
        acc[category] = this.emojis.filter((emoji) => {
          return emoji.category === category
        })
        return acc
      }, {})
    }
  },*/
  methods: {
    embedName(type) {
      if (type === "poll-v1") {
        return "Interactive Poll"
      } else if (type === "embed-v1") {
        return "Standard Embed"
      } else {
        return type
      }
    },
    createPoll() {
      this.embeds.push({
        type: "poll-v1",
        title: this.poll.title,
        options: this.poll.options,
        description: this.poll.description
      })
    },
    addEmoji(emoji) {
      this.message += emoji
    },
    twemoji(emoji) {
      return twemoji.parse(emoji, {
        folder: "svg",
        ext: ".svg"
      })
    },
    openFileInput() {
      this.$refs["file-input"].$refs.input.click()
    },
    tabCompletion() {
      if (!this.completions.length) {
        const word = this.message.split(" ").pop().toLowerCase()
        const user = this.chat.chat.users.find((u) =>
          u.username.toLowerCase().startsWith(word)
        )
        if (user) {
          if (word.length) {
            this.message = this.message.replace(
              this.message.split(" ").pop(),
              user.username + ", "
            )
          } else {
            this.message = this.message + user.username + ", "
          }
          this.$nextTick(() => {
            this.completionWord = this.message.split(" ").pop()
            this.completions.push(user.username)
          })
        }
      } else {
        const user = this.chat.chat.users.find(
          (u) =>
            u.username.toLowerCase().startsWith(this.completionWord) &&
            !this.completions.includes(u.username)
        )
        if (user) {
          this.message = this.message.replace(
            this.completions[this.completions.length - 1] + ", ",
            user.username + ", "
          )
          this.$nextTick(() => {
            this.completions.push(user.username)
          })
        }
      }
    },
    handleEditMessage() {
      if (!this.message?.length) {
        this.editLastMessage()
      }
    },
    handleMessage() {
      if (this.edit) {
        this.editMessage()
      } else {
        this.sendMessage()
      }
    },
    editMessage() {
      if (this.message.length > 0) {
        this.axios
          .put(
            process.env.VUE_APP_BASE_URL +
              "/api/v1/communications/" +
              this.$route.params.id +
              "/message/edit",
            {
              id: this.edit.id,
              content: this.message
            }
          )
          .then(() => {
            this.edit.editing = false
            this.edit.id = null
            this.focusInput()
            this.endEdit()
            // response will be handled via WebSocket
          })
          .catch((e) => {
            AjaxErrorHandler(this.$store)(e)
          })
      }
    },
    newLine(event) {
      this.message = event.target.value + "\n"
    },
    handleEsc() {
      if (!this.edit) {
        if (this.replying) {
          this.endSend()
        }
      } else {
        this.endEdit()
      }
    },
    getURLForImage() {
      const file = this.file
      const reader = new FileReader()
      reader.onload = (e) => {
        this.blobURL = e.target.result
      }
      reader.readAsDataURL(file)
    },
    handleChange() {
      if (this.$store.state.user.storedStatus !== "invisible") {
        if (this.typingDate) {
          const now = new Date()
          if (now - this.typingDate > 5000) {
            this.typingDate = now
            this.axios.put(
              process.env.VUE_APP_BASE_URL +
                "/api/v1/communications/" +
                this.chat.id +
                "/typing"
            )
          }
        } else {
          this.typingDate = new Date()
          this.axios.put(
            process.env.VUE_APP_BASE_URL +
              "/api/v1/communications/" +
              this.chat.id +
              "/typing"
          )
        }
      }
    },
    handlePaste(data) {
      if (data.clipboardData.items.length) {
        for (const item of data.clipboardData.items) {
          if (item.kind === "file") {
            this.file = item.getAsFile()
            this.getURLForImage()
          }
        }
      }
    },
    focusInput() {
      const input = document.getElementById("message-input")
      input.focus()
    },
    sendMessage() {
      this.focusInput()
      let message = this.message
      this.message = ""
      if (this.file || message.length > 0) {
        message = message.replaceAll(
          /:([a-zA-Z0-9_\-+]+):/g,
          (match, group1) => {
            const emoji = emojis.find((emoji) => {
              return emoji.aliases.includes(group1)
            })
            if (emoji) {
              return emoji.emoji
            } else {
              return match
            }
          }
        )
        if (!this.file) {
          this.axios
            .post(
              process.env.VUE_APP_BASE_URL +
                "/api/v1/communications/" +
                this.$route.params.id +
                "/message",
              {
                message: message,
                replyId: this.replying?.id,
                embeds: this.embeds
              }
            )
            .then(() => {
              this.focusInput()
              this.autoScroll()
              this.endSend()
              this.embeds = []
            })
            .catch((e) => {
              console.log(e)
              AjaxErrorHandler(this.$store)(e)
            })
        } else {
          if (this.uploading) return
          if (this.file.size > 50 * 1024 * 1024) {
            this.$toast.error(
              "The file you are trying to upload is too large. Maximum 50MB."
            )
            return
          }
          this.uploading = true
          const formData = new FormData()
          formData.append("message", message)
          if (this.replying) {
            formData.append("replyId", this.replying.id)
          }
          formData.append("file", this.file)
          formData.append("embeds", this.embeds)
          this.axios
            .post(
              process.env.VUE_APP_BASE_URL +
                "/api/v1/communications/" +
                this.$route.params.id +
                "/formData/message",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data"
                },
                onUploadProgress: function (progressEvent) {
                  this.uploadPercentage = parseInt(
                    Math.round(
                      (progressEvent.loaded / progressEvent.total) * 100
                    )
                  )
                }.bind(this)
              }
            )
            .then(() => {
              this.focusInput()
              this.autoScroll()
              this.endSend()
              this.file = null
              this.uploading = false
              this.uploadPercentage = 0
              this.embeds = []
            })
            .catch((e) => {
              this.uploading = false
              this.uploadPercentage = 0
              console.log(e)
              AjaxErrorHandler(this.$store)(e)
            })
        }
      }
    }
  },
  mounted() {
    if (this.edit) {
      this.message = this.edit.content
    }
  },
  watch: {
    message() {
      this.handleChange()
    }
  }
}
</script>

<style scoped>
.no-focus:focus::before {
  opacity: 0 !important;
}
</style>
