<template>
  <div v-if="!message.type" class="rounded-l">
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
        'text-xs-right': message.userId === $store.state.user.id,
        'text-xs-left': message.userId !== $store.state.user.id
      }"
    >
      <v-avatar size="48" class="mr-2">
        <v-img
          v-if="message.user.avatar"
          :src="$store.state.baseURL + '/usercontent/' + message.user.avatar"
          class="elevation-1"
        />
        <v-icon v-else class="elevation-1"> mdi-account </v-icon>
      </v-avatar>
      <v-list-item-content>
        <v-list-item-subtitle>
          {{ getName(message.user) }}
          <v-chip v-if="message.user.bot" color="calendarNormalActivity" small>
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
        <p v-markdown style="overflow-wrap: anywhere">
          {{ message.content }}
        </p>
      </v-list-item-content>
    </v-list-item>
  </div>
</template>

<script>
export default {
  name: "SimpleMessage",
  props: ["message", "index"],
  methods: {
    jumpToMessage(id) {
      this.$store.dispatch("jumpToMessage", id)
    },
    getName(user) {
      if (user.nickname?.nickname) {
        return user.nickname.nickname
      } else {
        return user.username
      }
    }
  }
}
</script>

<style scoped></style>
