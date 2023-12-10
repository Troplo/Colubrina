<template>
  <div id="admin-users">
    <v-dialog v-model="create.dialog" width="500">
      <v-card color="card">
        <v-toolbar color="toolbar">
          <v-toolbar-title>Create User</v-toolbar-title>
        </v-toolbar>
        <v-container>
          <v-form @submit.prevent="createUser">
            <v-text-field v-model="create.username" label="Username" />
            <v-text-field v-model="create.email" label="Email" />
            <v-text-field
              v-model="create.password"
              label="Password"
              type="password"
            />
            <v-switch
              v-model="create.emailVerified"
              inset
              label="Email Verified?"
            />
            <v-btn text type="submit" color="primary"> Create </v-btn>
          </v-form>
        </v-container>
      </v-card>
    </v-dialog>
    <v-toolbar color="toolbar">
      <v-toolbar-title>Users ({{ users.count }})</v-toolbar-title>
      <v-spacer />
      <v-btn icon @click="create.dialog = true">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <v-btn icon @click="getUsers">
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
      <template #[`item.index`]="{ index }">
        {{ index }}
      </template>
      <template #[`item.actions`]="{ item }">
        <v-tooltip top>
          <template #activator="{ on }">
            <v-btn
              icon
              :disabled="item.id === $store.state.user.id || item.admin"
              v-on="on"
              @click="banUser(item)"
            >
              <v-icon>mdi-gavel</v-icon>
            </v-btn>
          </template>
          <span>Ban</span>
        </v-tooltip>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler.js"

export default {
  name: "AdminUsers",
  data() {
    return {
      users: [],
      create: {
        dialog: false,
        username: "",
        email: "",
        password: "",
        emailVerified: false
      },
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
          text: "Username",
          value: "username"
        },
        {
          text: "Email",
          value: "email"
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
          text: "Theme",
          value: "themeObject.name"
        },
        {
          text: "Last Seen At",
          value: "lastSeenAt"
        },
        {
          text: "Admin",
          value: "admin"
        },
        {
          text: "Banned",
          value: "banned"
        },
        {
          text: "Email Verified",
          value: "emailVerified"
        },
        {
          text: "Actions",
          value: "actions",
          sortable: false
        }
      ]
    }
  },
  mounted() {
    this.getUsers()
  },
  methods: {
    createUser() {
      this.axios
        .post(`/api/v1/admin/user`, this.create)
        .then(() => {
          this.getUsers()
          this.$toast.success("Action performed successfully.")
          this.create = {
            dialog: false,
            username: "",
            email: "",
            password: "",
            emailVerified: false
          }
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    banUser(item) {
      this.axios
        .put(`/api/v1/admin/user/${item.id}`, {
          banned: !item.banned
        })
        .then(() => {
          this.getUsers()
          this.$toast.success("Action performed successfully.")
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
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
  }
}
</script>

<style scoped></style>
