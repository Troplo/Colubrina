<template>
  <div id="admin-themes">
    <v-toolbar color="toolbar">
      <v-toolbar-title>Themes ({{ themes.count }})</v-toolbar-title>
      <v-spacer />
      <v-btn icon @click="getThemes">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-toolbar>
    <v-data-table
      :items="themes.rows"
      :headers="headers"
      :items-per-page="20"
      :style="
        'background-color: ' +
        $vuetify.theme.themes[$vuetify.theme.dark ? 'dark' : 'light'].card
      "
    >
      <template #[`item.actions`]="{ item }">
        <v-btn text color="primary" @click="applyTheme(item)"> Apply </v-btn>
      </template>
      <template #[`item.theme.css`]="{ item }">
        {{ item.theme.css ? "Yes" : "No" }}
      </template>
    </v-data-table>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler.js"

export default {
  name: "AdminThemes",
  data() {
    return {
      themes: [],
      headers: [
        {
          text: "ID",
          value: "id"
        },
        {
          text: "Name",
          value: "name"
        },
        {
          text: "User ID",
          value: "user.id"
        },
        {
          text: "Username",
          value: "user.username"
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
          value: "theme.primaryType"
        },
        {
          text: "Users Count",
          value: "users.length"
        },
        {
          text: "CSS",
          value: "theme.css"
        },
        {
          text: "Actions",
          value: "actions"
        }
      ]
    }
  },
  mounted() {
    this.getThemes()
  },
  methods: {
    applyTheme(theme) {
      this.axios
        .put("/api/v1/admin/themes/apply", {
          themeId: theme.id
        })
        .then(async () => {
          await this.$store.dispatch("getUserInfo")
          this.$toast.success("Theme applied successfully")
        })
    },
    getThemes() {
      this.axios
        .get("/api/v1/admin/themes")
        .then((res) => {
          this.themes = res.data
          this.themes.rows = res.data.rows.map((user) => {
            return {
              ...user,
              createdAt: this.$date(user.createdAt).format(
                "YYYY/MM/DD HH:mm:ss"
              ),
              updatedAt: this.$date(user.updatedAt).format(
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
