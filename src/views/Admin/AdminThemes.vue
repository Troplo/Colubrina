<template>
  <div id="admin-themes">
    <v-toolbar color="toolbar">
      <v-toolbar-title>Themes ({{ themes.count }})</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn @click="getThemes" icon>
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
      <template v-slot:item.actions="{ item }">
        <v-btn text color="primary" @click="applyTheme(item)"> Apply </v-btn>
      </template>
      <template v-slot:item.theme.css="{ item }">
        {{ item.theme.css ? "Yes" : "No" }}
      </template>
    </v-data-table>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler"

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
          text: "Compass User ID",
          value: "user.id"
        },
        {
          text: "Sussi Auth ID",
          value: "user.sussiId"
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
  },
  mounted() {
    this.getThemes()
  }
}
</script>

<style scoped></style>
