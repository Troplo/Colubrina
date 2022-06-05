<template>
  <div id="admin-users">
    <v-toolbar color="toolbar">
      <v-toolbar-title>Users ({{ users.count }})</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn @click="getUsers" icon>
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-toolbar>
    <v-data-table
      :items="users.rows"
      :headers="headers"
      :items-per-page="20"
      :style="
        'background-color: ' +
        $vuetify.theme.themes[$vuetify.theme.dark ? 'dark' : 'light'].card
      "
    >
      <template v-slot:item.index="{ index }">
        {{ index }}
      </template>
    </v-data-table>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler"

export default {
  name: "AdminUsers",
  data() {
    return {
      users: [],
      headers: [
        {
          text: "Index",
          value: "index",
          sortable: false
        },
        {
          text: "ID",
          value: "id"
        },
        {
          text: "Compass User ID",
          value: "compassUserId"
        },
        {
          text: "Sussi Auth ID",
          value: "sussiId"
        },
        {
          text: "Username",
          value: "displayCode"
        },
        {
          text: "Instance",
          value: "instance"
        },
        {
          text: "Created At",
          value: "createdAt"
        },
        {
          text: "Updated At",
          value: "updatedAt"
        },
        {
          text: "Base Theme",
          value: "theme"
        },
        {
          text: "Communications",
          value: "privacy.communications.enabled"
        },
        {
          text: "Theme",
          value: "themeObject.name"
        },
        {
          text: "Last Seen At",
          value: "lastSeenAt"
        }
      ]
    }
  },
  methods: {
    getUsers() {
      this.axios
        .get("/api/v1/admin/users")
        .then((res) => {
          this.users = res.data
          this.users.rows = res.data.rows.map((user) => {
            return {
              ...user,
              createdAt: this.$date(user.createdAt).format(
                "YYYY/MM/DD HH:mm:ss"
              ),
              updatedAt: this.$date(user.updatedAt).format(
                "YYYY/MM/DD HH:mm:ss"
              ),
              lastSeenAt: this.$date(user.lastSeenAt).format(
                "YYYY/MM/DD HH:mm:ss"
              )
            }
          })
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    }
  },
  mounted() {
    this.getUsers()
  }
}
</script>

<style scoped></style>
