<template>
  <div>
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
      style="margin-bottom: 5px"
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
      v-model="message"
      @paste="handlePaste"
      @change="handleChange"
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
      <template v-slot:prepend>
        <v-file-input
          style="margin-top: -18px"
          single-line
          hide-input
          v-model="file"
          @change="getURLForImage"
          v-if="!edit"
        ></v-file-input>
      </template>
    </v-textarea>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler"

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
      message: "",
      file: null,
      blobURL: null
    }
  },
  methods: {
    handleEditMessage() {
      if(!this.message?.length) {
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
        const item = data.clipboardData.items[0]
        if (item.kind === "file") {
          this.file = item.getAsFile()
          this.getURLForImage()
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
        const emojis = require("../lib/emojis.json")
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
                replyId: this.replying?.id
              }
            )
            .then(() => {
              this.focusInput()
              this.autoScroll()
              this.endSend()
            })
            .catch((e) => {
              console.log(e)
              AjaxErrorHandler(this.$store)(e)
            })
        } else {
          const formData = new FormData()
          formData.append("message", message)
          if (this.replying) {
            formData.append("replyId", this.replying.id)
          }
          formData.append("file", this.file)
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
                }
              }
            )
            .then(() => {
              this.focusInput()
              this.autoScroll()
              this.endSend()
              this.file = null
            })
            .catch((e) => {
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
  }
}
</script>

<style scoped>
.no-focus:focus::before {
  opacity: 0 !important;
}
</style>
