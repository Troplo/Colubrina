<template>
  <div id="admin-users">
    <v-dialog width="500" v-model="create.dialog">
      <v-card color="card">
        <v-toolbar color="toolbar">
          <v-toolbar-title>Create User</v-toolbar-title>
        </v-toolbar>
        <v-container>
          <v-form @submit.prevent="createUser">
            <v-text-field
              label="Username"
              v-model="create.username"
            ></v-text-field>
            <v-text-field label="Email" v-model="create.email"></v-text-field>
            <v-text-field
              label="Password"
              type="password"
              v-model="create.password"
            ></v-text-field>
            <v-switch
              inset
              label="Email Verified?"
              v-model="create.emailVerified"
            ></v-switch>
            <v-btn text type="submit" color="primary">Create</v-btn>
          </v-form>
        </v-container>
      </v-card>
    </v-dialog>
    <v-toolbar color="toolbar">
      <v-toolbar-title>Users ({{ users.count }})</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn @click="create.dialog = true" icon>
        <v-icon>mdi-plus</v-icon>
      </v-btn>
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
      <template v-slot:item.actions="{ item }">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              icon
              @click="banUser(item)"
              :disabled="item.id === $store.state.user.id || item.admin"
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
import AjaxErrorHandler from "@/lib/errorHandler"

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
  },
  mounted() {
    this.getUsers()
  }
}
</script>

<style scoped></style>
