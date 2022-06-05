<template>
  <div id="communications-chat" @dragover.prevent @drop.prevent>
    <v-dialog
      v-model="preview.dialog"
      elevation="0"
      :width="preview.width"
      :height="preview.height"
      :max-width="1000"
      :max-height="600"
      content-class="rounded-0"
    >
      <v-card color="card">
        <v-img
          :src="preview.src"
          :max-width="1000"
          :max-height="600"
          contain
        ></v-img>
        <v-container>
          <a :href="preview.src" style="text-decoration: none" target="_blank">
            <small> Open Externally </small>
          </a>
        </v-container>
      </v-card>
    </v-dialog>

    <v-row v-if="!loading" @drop="handleDrag">
      <v-col id="chat-col">
        <v-app>
          <v-card class="rounded-xl" color="card">
            <v-card-text>
              <v-list two-line elevation="0" ref="message-list">
                <template v-for="(message, index) in messages">
                  <v-toolbar
                    @click="jumpToMessage(message.replyId)"
                    :key="message.keyId + '-reply-toolbar'"
                    elevation="0"
                    outlined
                    height="40"
                    color="card"
                    v-if="message.reply"
                    style="cursor: pointer"
                  >
                    <v-icon class="mr-2">mdi-reply</v-icon>
                    <v-avatar size="24" class="mr-2">
                      <v-img
                        :src="'/usercontent/' + message.reply.user.avatar"
                        v-if="message.reply.user.avatar"
                        class="elevation-1"
                      />
                      <v-icon v-else class="elevation-1"> mdi-account </v-icon>
                    </v-avatar>
                    <template v-if="message.reply.attachments.length">
                      <v-icon class="mr-2">mdi-file-image</v-icon>
                    </template>
                    <template
                      v-if="
                        !message.reply.content &&
                        message.reply.attachments.length
                      "
                    >
                      Click to view attachment
                    </template>
                    {{ message.reply.content.substring(0, 100) }}
                  </v-toolbar>
                  <v-list-item
                    :key="message.keyId"
                    :class="{
                      'text-xs-right': message.userId === $store.state.user.id,
                      'text-xs-left': message.userId !== $store.state.user.id
                    }"
                    :id="'message-' + index"
                  >
                    <v-avatar size="48" class="mr-2">
                      <v-img
                        :src="'/usercontent/' + message.user.avatar"
                        v-if="message.user.avatar"
                        class="elevation-1"
                      />
                      <v-icon v-else class="elevation-1"> mdi-account </v-icon>
                    </v-avatar>
                    <v-list-item-content>
                      <v-list-item-subtitle>
                        {{ message.user.username }}
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
                              $date(message.editedAt).format(
                                "DD/MM/YYYY hh:mm:ss A"
                              )
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
                        >
                          <v-card
                            elevaion="0"
                            color="bg"
                            max-width="25%"
                            width="25%"
                            class="ml-3"
                          >
                            <v-container>
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
                                  <div>
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
                                            <v-icon large
                                              >mdi-arrow-expand-all</v-icon
                                            >
                                          </v-overlay>
                                        </v-fade-transition>
                                      </template>
                                    </v-img>
                                  </div>
                                </v-hover>
                                <v-card-actions>
                                  MediaProxy Image
                                  <v-spacer />
                                  <v-btn
                                    text
                                    icon
                                    :href="embed.url"
                                    target="_blank"
                                  >
                                    <v-icon> mdi-download </v-icon>
                                  </v-btn>
                                </v-card-actions>
                              </template>
                            </v-container>
                          </v-card>
                        </v-row>
                      </template>
                      <template v-if="edit.id !== message.id">
                        <v-card
                          v-for="(attachment, index) in message.attachments"
                          :key="attachment.id"
                          :id="'attachment-' + index"
                          max-width="40%"
                          elevaion="0"
                          color="bg"
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
                                :src="'/usercontent/' + attachment.attachment"
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
                                      <v-icon large
                                        >mdi-arrow-expand-all</v-icon
                                      >
                                    </v-overlay>
                                  </v-fade-transition>
                                </template>
                              </v-img>
                            </div>
                          </v-hover>
                          <v-card-text v-else>
                            <v-icon class="mr-2" :size="48">
                              {{
                                fileTypes[attachment.extension] || "mdi-file"
                              }}
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
                              :href="'/usercontent/' + attachment.attachment"
                              target="_blank"
                            >
                              <v-icon> mdi-download </v-icon>
                            </v-btn>
                          </v-card-actions>
                        </v-card>
                      </template>
                      <v-text-field
                        v-model="edit.content"
                        v-if="edit.editing && edit.id === message.id"
                        autofocus
                        :value="message.content"
                        label="Type a message"
                        placeholder="Type a message"
                        type="text"
                        ref="edit-input"
                        outlined
                        append-outer-icon="mdi-send"
                        @keyup.enter="editMessage(message)"
                        @keydown.esc="
                          edit.content = ''
                          edit.editing = false
                          edit.id = null
                          focusInput()
                        "
                        @click:append-outer="editMessage(message)"
                      />
                    </v-list-item-content>
                    <v-list-item-action>
                      <v-list-item-subtitle>
                        {{
                          $date(message.createdAt).format("DD/MM/YYYY hh:mm A")
                        }}
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
                            replying = message
                            focusInput()
                          "
                        >
                          <v-icon> mdi-reply </v-icon>
                        </v-btn>
                      </v-list-item-subtitle>
                    </v-list-item-action>
                  </v-list-item>
                </template>
              </v-list>
              <v-app-bar app bottom height="100px" color="bg" elevation="0">
                <v-toolbar
                  elevation="0"
                  outlined
                  height="40"
                  color="card"
                  v-if="file"
                  style="cursor: pointer"
                  class="mb-2"
                >
                  <v-toolbar-title>
                    <v-icon> mdi-attachment </v-icon>
                    {{ file.name }}
                  </v-toolbar-title>
                  <v-spacer></v-spacer>
                  <v-btn icon @click="file = null">
                    <v-icon> mdi-close </v-icon>
                  </v-btn>
                </v-toolbar>
                <v-toolbar
                  @click="jumpToMessage(replying?.id)"
                  elevation="0"
                  outlined
                  height="40"
                  color="card"
                  v-if="replying"
                  style="cursor: pointer"
                  class="mb-2"
                >
                  <v-icon class="mr-2">mdi-reply</v-icon>
                  <v-avatar size="24" class="mr-2">
                    <v-img
                      :src="'/usercontent/' + replying.user.avatar"
                      v-if="replying.user.avatar"
                      class="elevation-1"
                    />
                    <v-icon v-else class="elevation-1"> mdi-account </v-icon>
                  </v-avatar>
                  <template v-if="replying.attachments.length">
                    <v-icon class="mr-2">mdi-file-image</v-icon>
                  </template>
                  <template
                    v-if="!replying.content && replying.attachments.length"
                  >
                    Click to view attachment
                  </template>
                  {{ replying.content.substring(0, 100) }}
                  <v-spacer></v-spacer>
                  <v-btn icon @click="replying = null" class="mr-2">
                    <v-icon> mdi-close </v-icon>
                  </v-btn>
                </v-toolbar>
                <v-text-field
                  v-model="message"
                  autofocus
                  solo
                  label="Type a message"
                  placeholder="Type a message"
                  type="text"
                  ref="message-input"
                  outlined
                  append-outer-icon="mdi-send"
                  auto-grow
                  @keyup.enter="sendMessage"
                  @keyup.up="editLastMessage"
                  @keyup.esc="handleEsc"
                  @click:append-outer="sendMessage"
                  @paste="handlePaste"
                >
                  <template v-slot:prepend>
                    <v-file-input
                      single-line
                      hide-input
                      v-model="file"
                      @change="getURLForImage"
                    ></v-file-input>
                  </template>
                </v-text-field>
                <p
                  style="margin-top: -17px; position: absolute"
                  v-if="usersTyping.length"
                >
                  {{ usersTyping.map((user) => user.username).join(", ") }}
                  {{ usersTyping.length > 1 ? " are" : " is" }} typing...
                </p>
              </v-app-bar>
            </v-card-text>
          </v-card>
        </v-app>
      </v-col>
      <v-navigation-drawer
        app
        right
        floating
        cols="3"
        class=""
        id="search-col"
        v-if="$store.state.searchPanel"
      >
        <v-card class="d-flex flex-column fill-height rounded-xl" color="card">
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
            ></v-text-field>
            <v-list two-line color="card" ref="message-list-search">
              <template v-for="(message, index) in search.results">
                <v-toolbar
                  @click="jumpToMessage(message.replyId)"
                  :key="message.keyId + '-reply-toolbar'"
                  elevation="0"
                  outlined
                  height="40"
                  color="card"
                  v-if="message.reply"
                  style="cursor: pointer"
                >
                  <v-icon class="mr-2">mdi-reply</v-icon>
                  <v-avatar size="24" class="mr-2">
                    <v-img
                      :src="'/usercontent/' + message.reply.user.avatar"
                      v-if="message.reply.user.avatar"
                      class="elevation-1"
                    />
                    <v-icon v-else class="elevation-1"> mdi-account </v-icon>
                  </v-avatar>
                  <template v-if="message.reply.attachments.length">
                    <v-icon class="mr-2">mdi-file-image</v-icon>
                  </template>
                  <template
                    v-if="
                      !message.reply.content && message.reply.attachments.length
                    "
                  >
                    Click to view attachment
                  </template>
                  {{ message.reply.content.substring(0, 100) }}
                </v-toolbar>
                <v-list-item
                  style="cursor: pointer"
                  @click="jumpToMessage(message.id)"
                  :key="message.keyId"
                  :class="{
                    'text-xs-right': message.userId === $store.state.user.id,
                    'text-xs-left': message.userId !== $store.state.user.id
                  }"
                  :id="'message-' + index"
                >
                  <v-avatar size="48" class="mr-2">
                    <v-img
                      :src="'/usercontent/' + message.user.avatar"
                      v-if="message.user.avatar"
                      class="elevation-1"
                    />
                    <v-icon v-else class="elevation-1"> mdi-account </v-icon>
                  </v-avatar>
                  <v-list-item-content>
                    <v-list-item-subtitle>
                      {{ message.user.username }}
                      <small>
                        {{
                          $date(message.createdAt).format("DD/MM/YYYY hh:mm A")
                        }}</small
                      >
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
                            $date(message.editedAt).format(
                              "DD/MM/YYYY hh:mm:ss A"
                            )
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
                      >
                        <v-card
                          elevaion="0"
                          color="bg"
                          max-width="25%"
                          width="25%"
                          class="ml-3"
                        >
                          <v-container>
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
                            <v-row
                              v-if="embed.type === 'compass'"
                              @click="$router.push(embed.path)"
                              style="cursor: pointer"
                            >
                              <v-container
                                :style="
                                  'background: url(/' +
                                  embed.compass.banner +
                                  ')'
                                "
                              >
                                <h4>BetterCompass</h4>
                                <h3>
                                  {{ embed.compass.name }}
                                </h3>
                                <p>
                                  {{ embed.compass.displayName }}
                                </p>
                              </v-container>
                            </v-row>
                            <template v-else-if="embed.type === 'image'">
                              <v-hover v-slot="{ hover }">
                                <div>
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
                                          <v-icon large
                                            >mdi-arrow-expand-all</v-icon
                                          >
                                        </v-overlay>
                                      </v-fade-transition>
                                    </template>
                                  </v-img>
                                </div>
                              </v-hover>
                              <v-card-actions>
                                MediaProxy Image
                                <v-spacer />
                                <v-btn
                                  text
                                  icon
                                  :href="embed.url"
                                  target="_blank"
                                >
                                  <v-icon> mdi-download </v-icon>
                                </v-btn>
                              </v-card-actions>
                            </template>
                          </v-container>
                        </v-card>
                      </v-row>
                    </template>
                    <template v-if="edit.id !== message.id">
                      <v-card
                        v-for="(attachment, index) in message.attachments"
                        :key="attachment.id"
                        :id="'attachment-' + index"
                        max-width="40%"
                        elevaion="0"
                        color="bg"
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
                              :src="'/usercontent/' + attachment.attachment"
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
                            :href="'/usercontent/' + attachment.attachment"
                            target="_blank"
                          >
                            <v-icon> mdi-download </v-icon>
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </template>
                    <v-text-field
                      v-model="edit.content"
                      v-if="edit.editing && edit.id === message.id"
                      autofocus
                      :value="message.content"
                      label="Type a message"
                      placeholder="Type a message"
                      type="text"
                      ref="edit-input"
                      outlined
                      append-outer-icon="mdi-send"
                      @keyup.enter="editMessage(message)"
                      @keydown.esc="
                        edit.content = ''
                        edit.editing = false
                        edit.id = null
                        focusInput()
                      "
                      @click:append-outer="editMessage(message)"
                    />
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-list>
          </v-card-text>
        </v-card>
      </v-navigation-drawer>
      <v-navigation-drawer
        right
        app
        floating
        background-color="bg"
        color="bg"
        width="20%"
        class=""
        id="search-col"
        v-if="$store.state.userPanel && chat.chat.type === 'group'"
      >
        <v-card
          class="d-flex flex-column fill-height rounded-xl"
          :max-height="viewport()"
          :min-height="viewport()"
          color="card"
        >
          <v-toolbar color="bg" class="flex-grow-0 flex-shrink-0">
            <v-toolbar-title> Members </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="$store.state.userPanel = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-list two-line color="card">
            <v-list-item-group class="rounded-xl">
              <template v-for="item in chat.chat.associations">
                <v-list-item :key="item.title">
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
                        :src="'/usercontent/' + item.user.avatar"
                      />
                      <v-icon v-else> mdi-account </v-icon>
                    </v-list-item-avatar>
                  </v-badge>
                  <template>
                    <v-list-item-content>
                      <v-list-item-title>
                        {{ item.user.username }}
                      </v-list-item-title>
                    </v-list-item-content>
                  </template>
                </v-list-item>
              </template>
            </v-list-item-group>
          </v-list>
          <br />
        </v-card>
      </v-navigation-drawer>
    </v-row>
  </div>
</template>
<script>
import AjaxErrorHandler from "@/lib/errorHandler"

export default {
  name: "CommunicationsChat",
  props: ["chat", "loading", "items"],
  data: () => ({
    search: {
      query: "",
      results: [],
      pager: {},
      loading: false,
      page: 1
    },
    preview: {
      dialog: false,
      src: "",
      height: 0,
      width: 0
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
    userPanel: true
  }),
  computed: {
    getDirectRecipient() {
      const user = this.chat.chat.users.find(
        (user) => user.id !== this.$store.state.user.id
      )
      if (user) {
        return user
      } else {
        return this.chat.chat.users[0]
      }
    }
  },
  methods: {
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
          .get("/api/v1/communications/" + this.$route.params.id + "/search", {
            params: {
              query: this.search.query,
              page: this.search.page
            }
          })
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
        ? attachment.attachment
        : attachment.mediaProxyLink
      this.preview.src = link
      const img = new Image()
      img.onload = () => {
        this.preview.height = img.height
        this.preview.width = img.width
        this.preview.dialog = true
      }
      img.src = link
    },
    handleDrag(e) {
      console.log(1)
      if (e.dataTransfer.files.length) {
        this.file = e.dataTransfer.files[0]
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
    getURLForImage() {
      const file = this.file
      const reader = new FileReader()
      reader.onload = (e) => {
        this.blobURL = e.target.result
      }
      reader.readAsDataURL(file)
    },
    deleteMessage(message) {
      this.axios
        .delete(
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
    jumpToMessage(id) {
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
        }
      } catch {
        console.log("Could not auto scroll (Jump to message)")
      }
    },
    handleEsc() {
      if (this.replying) {
        this.replying = null
      }
    },
    viewport() {
      return window.innerHeight - 25
    },
    typing() {
      this.usersTyping = this.usersTyping.filter((user) => {
        return this.$date().isBefore(user.timeout)
      })
    },
    focusInput() {
      this.$refs["message-input"].$refs.input.focus()
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
    editMessage() {
      if (this.edit.content.length > 0) {
        this.axios
          .put(
            "/api/v1/communications/" + this.$route.params.id + "/message/edit",
            {
              id: this.edit.id,
              content: this.edit.content
            }
          )
          .then(() => {
            this.edit.editing = false
            this.edit.id = null
            this.edit.content = ""
            this.$refs["message-input"].$refs.input.focus()
            // response will be handled via WebSocket
          })
          .catch((e) => {
            AjaxErrorHandler(this.$store)(e)
          })
      }
    },
    autoScroll(smooth = true) {
      this.$nextTick(() => {
        try {
          const lastIndex = this.messages.length - 1
          const lastMessage = document.querySelector(`#message-${lastIndex}`)
          if (smooth) {
            lastMessage.scrollIntoView({
              behavior: "smooth"
            })
          } else {
            lastMessage.scrollIntoView()
          }
          this.autoScrollRetry = 0
        } catch (e) {
          console.log("Could not auto scroll, retrying...")
          if (this.autoScrollRetry < 20) {
            setTimeout(() => {
              this.autoScroll(smooth)
            }, 50)
            this.autoScrollRetry++
          } else {
            console.log("Could not auto scroll, retry limit reached")
          }
        }
      })
    },
    getMessages() {
      this.axios
        .get(
          "/api/v1/communications/" +
            this.$route.params.id +
            "/messages?limit=50"
        )
        .then((res) => {
          this.messages = res.data
          this.$nextTick(() => {
            this.autoScroll(false)
          })
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    markRead() {
      this.axios.put(
        "/api/v1/communications/" + this.$route.params.id + "/read"
      )
    },
    sendMessage() {
      if (this.message.length > 0 || this.file) {
        const emojis = require("../../lib/emojis.json")
        this.message = this.message.replaceAll(
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
              "/api/v1/communications/" + this.$route.params.id + "/message",
              {
                message: this.message,
                replyId: this.replying?.id
              }
            )
            .then((res) => {
              this.messages.push(res.data)
              this.message = ""
              this.autoScroll()
              this.replying = null
              const chat = this.items.find(
                (item) => item.chatId === this.chat.chatId
              )
              if (chat) {
                const index = this.items.indexOf(chat)
                this.items.splice(index, 1)
                this.items.unshift(chat)
              }
            })
            .catch((e) => {
              AjaxErrorHandler(this.$store)(e)
            })
        } else {
          const formData = new FormData()
          formData.append("message", this.message)
          if (this.replying) {
            formData.append("replyId", this.replying.id)
          }
          formData.append("file", this.file)
          this.axios
            .post(
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
            .then((res) => {
              this.messages.push(res.data)
              this.message = ""
              this.autoScroll()
              this.replying = null
              this.file = null
              const chat = this.items.find(
                (item) => item.chatId === this.chat.chatId
              )
              if (chat) {
                const index = this.items.indexOf(chat)
                this.items.splice(index, 1)
                this.items.unshift(chat)
              }
            })
            .catch((e) => {
              AjaxErrorHandler(this.$store)(e)
            })
        }
      }
    }
  },
  mounted() {
    setInterval(() => {
      this.typing()
    }, 1000)
    this.getMessages()
    this.markRead()
    if (localStorage.getItem("userPanel")) {
      this.$store.state.userPanel = JSON.parse(
        localStorage.getItem("userPanel")
      )
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
    this.$socket.on("message", (message) => {
      if (message.chatId === this.chat.chat.id) {
        this.messages.push(message)
        this.autoScroll()
        this.markRead()
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
          this.autoScroll(true)
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
    userPanel() {
      localStorage.setItem("userPanel", JSON.stringify(this.userPanel))
    },
    message() {
      if (this.$store.state.user.storedStatus !== "invisible") {
        if (this.typingDate) {
          const now = new Date()
          if (now - this.typingDate > 5000) {
            this.typingDate = now
            this.axios.put(
              "/api/v1/communications/" + this.$route.params.id + "/typing"
            )
          }
        } else {
          this.typingDate = new Date()
          this.axios.put(
            "/api/v1/communications/" + this.$route.params.id + "/typing"
          )
        }
      }
    },
    "$route.params.id"(val, oldVal) {
      this.$refs["message-input"].$refs.input.focus()
      let drafts = {}
      if (localStorage.getItem("drafts")) {
        drafts = JSON.parse(localStorage.getItem("drafts"))
      }
      if (this.message || drafts[oldVal]) {
        drafts[oldVal] = this.message
        localStorage.setItem("drafts", JSON.stringify(drafts))
      }
      this.message = drafts[val] || ""
      this.messages = []
      this.usersTyping = []
      this.replying = null
      this.getMessages()
      this.markRead()
    }
  }
}
</script>
