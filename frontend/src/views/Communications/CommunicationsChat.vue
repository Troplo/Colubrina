<template>
  <div id="communications-chat" @dragover.prevent @drop.prevent>
    <v-menu
      v-model="context.message.value"
      :position-x="context.message.x"
      :position-y="context.message.y"
      absolute
      offset-y
      class="rounded-l"
    >
      <v-list class="rounded-l" v-if="context.message.item">
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
    <NicknameDialog :nickname="context.nickname" />
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
      <v-col class="flex-grow-1 flex-shrink-1" id="chat-col">
        <v-card
          class="d-flex flex-column fill-height rounded-xl"
          style="overflow: auto; height: calc(100vh - 24px - 40px - 40px)"
          color="card"
          elevation="0"
        >
          <v-card-text class="flex-grow-1 overflow-y-auto">
            <v-list two-line color="card" ref="message-list">
              <template v-for="(message, index) in messages">
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
                    @contextmenu="show($event, 'message', message)"
                  >
                    <v-avatar size="48" class="mr-2">
                      <v-img
                        :src="
                          $store.state.baseURL +
                          '/usercontent/' +
                          message.user.avatar
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
                          {{
                            $date(message.createdAt).format(
                              "hh:mm A, DD/MM/YYYY"
                            )
                          }}
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
                          no-gutters
                        >
                          <v-card
                            elevaion="0"
                            :color="
                              embed.type === 'embed-v1'
                                ? embed.backgroundColor
                                : 'bg'
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
                                      <p v-else>
                                        Chart data could not be loaded.
                                      </p>
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
                                  <h4>
                                    You must update Colubrina to see this embed.
                                  </h4>
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
                          max-width="40%"
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
                    <v-list-item-action v-if="!$vuetify.breakpoint.mobile">
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
                <template v-else-if="message.type === 'leave'">
                  <v-list-item :key="message.keyId" :id="'message-' + index">
                    <v-icon color="red" class="mr-2 ml-1">
                      mdi-arrow-left
                    </v-icon>
                    <v-list-item-content>
                      {{ message.content }}
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
                <template v-else-if="message.type === 'join'">
                  <v-list-item :key="message.keyId" :id="'message-' + index">
                    <v-icon color="success" class="mr-2 ml-1">
                      mdi-arrow-right
                    </v-icon>
                    <v-list-item-content>
                      {{ message.content }}
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
                <template v-else-if="message.type === 'rename'">
                  <v-list-item :key="message.keyId" :id="'message-' + index">
                    <v-icon color="grey" class="mr-2 ml-1"> mdi-pencil </v-icon>
                    <v-list-item-content>
                      {{ message.content }}
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
                <template v-else-if="message.type === 'system'">
                  <v-list-item :key="message.keyId" :id="'message-' + index">
                    <v-icon color="grey" class="mr-2 ml-1"> mdi-pencil </v-icon>
                    <v-list-item-content>
                      {{ message.content }}
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
              </template>
            </v-list>
          </v-card-text>
          <v-card-text>
            <v-toolbar
              @click="jumpToMessage(replying?.id)"
              elevation="0"
              height="35"
              color="card"
              v-if="replying"
              style="cursor: pointer; overflow: hidden"
              class="mb-2"
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
            <v-toolbar
              height="29"
              color="transparent"
              elevation="0"
              style="margin-bottom: -12px; padding-top: 0"
            >
              <p v-if="usersTyping.length" style="float: left">
                {{ usersTyping.map((user) => getName(user)).join(", ") }}
                {{ usersTyping.length > 1 ? " are" : " is" }} typing...
              </p>
            </v-toolbar>
            <CommsInput
              :chat="chat"
              :replying="replying"
              :editLastMessage="editLastMessage"
              :autoScroll="autoScroll"
              :endSend="endSend"
            ></CommsInput>
          </v-card-text>
        </v-card>
      </v-col>
      <v-divider
        vertical
        style="z-index: 2; padding-right: 3px; padding-left: 3px"
        v-if="
          ($store.state.userPanel && !$vuetify.breakpoint.mobile) ||
          ($store.state.searchPanel && !$vuetify.breakpoint.mobile)
        "
      ></v-divider>
      <v-col
        cols="3"
        class=""
        id="search-col"
        v-if="$store.state.searchPanel && !$vuetify.breakpoint.mobile"
      >
        <v-card
          class="d-flex flex-column fill-height"
          style="overflow: scroll; height: calc(100vh - 24px - 40px - 40px)"
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
                      :src="
                        $store.state.baseURL +
                        '/usercontent/' +
                        message.user.avatar
                      "
                      v-if="message.user.avatar"
                      class="elevation-1"
                    />
                    <v-icon v-else class="elevation-1"> mdi-account </v-icon>
                  </v-avatar>
                  <v-list-item-content>
                    <v-list-item-subtitle>
                      {{ getName(message.user) }}
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
                          color="card"
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
      </v-col>
      <v-col
        :cols="$vuetify.breakpoint.xl ? 2 : 3"
        class="ml-2"
        id="user-col"
        v-if="
          $store.state.userPanel &&
          !$vuetify.breakpoint.mobile &&
          !$store.state.searchPanel
        "
      >
        <v-card
          class="d-flex flex-column fill-height rounded-xl"
          elevation="0"
          style="overflow: scroll; height: calc(100vh - 24px - 40px - 40px)"
          color="card"
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
import NicknameDialog from "@/components/NicknameDialog"
import UserDialog from "@/components/UserDialog"

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
  name: "CommunicationsChat",
  components: { UserDialog, NicknameDialog, CommsInput, Chart },
  props: ["chat", "loading", "items"],
  data: () => ({
    graphOptions: {
      responsive: true,
      maintainAspectRatio: false,
      title: {
        display: false
      }
    },
    page: 1,
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
    associations() {
      return this.chat.chat.associations.slice().sort((a, b) => {
        if (a.lastRead > b.lastRead) {
          return -1
        } else if (a.lastRead < b.lastRead) {
          return 1
        } else {
          return 0
        }
      })
    }
  },
  methods: {
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
          process.env.VUE_APP_BASE_URL +
            "/api/v1/communications/" +
            this.$route.params.id +
            "/messages?limit=50"
        )
        .then((res) => {
          this.messages = res.data
          this.markRead()
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
        process.env.VUE_APP_BASE_URL +
          "/api/v1/communications/" +
          this.$route.params.id +
          "/read"
      )
      this.markAsRead()
    }
  },
  mounted() {
    /*  // check if document.querySelector(`#message-${lastIndex}`) is scrolled to the top, and load new messages
    window.addEventListener("scroll", () => {
      const lastIndex = this.messages.length - 1
      const lastMessage = document.querySelector(`#message-${lastIndex}`)
      if (lastMessage && lastMessage.getBoundingClientRect().top < 0) {
        this.page += 1
        this.getMessages()
      }
    })*/
    setInterval(() => {
      this.typing()
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
    this.$socket.on("message", (message) => {
      if (message.chatId === this.chat.chatId) {
        this.messages.push(message)
        this.autoScroll()
        this.markRead()
        if (this.messages.length > 50) {
          this.messages.shift()
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
      this.messages = []
      this.usersTyping = []
      this.replying = null
      this.getMessages()
    }
  }
}
</script>
