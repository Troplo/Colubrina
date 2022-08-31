<template>
  <div id="admin-feedback">
    <v-toolbar color="toolbar">
      <v-toolbar-title>Feedback ({{ feedback.count }})</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn @click="getFeedback" icon>
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-toolbar>
    <v-container :fluid="$vuetify.breakpoint.lgAndDown">
      <v-card
        v-for="item in feedback.rows"
        :key="item.id"
        class="rounded-xl mb-2"
        color="card"
      >
        <v-toolbar color="toolbar">
          <v-toolbar-title>
            Feedback -
            {{ item.user.username }} ({{ item.user.id }})
          </v-toolbar-title>
        </v-toolbar>
        <v-container :fluid="$vuetify.breakpoint.lgAndDown">
          {{ item.feedbackText.substring(0, 1000) }}
          <br />
          <small v-if="item.user">
            Route: {{ item.route }}<br />
            Rating: {{ item.starRating }}<br />
            Created At:
            {{ $date(item.createdAt).format("YYYY-MM-DD hh:mm A") }}</small
          >
        </v-container>
      </v-card>
    </v-container>
  </div>
</template>

<script>
export default {
  name: "AdminFeedback",
  data() {
    return {
      feedback: []
    }
  },
  methods: {
    getFeedback() {
      this.axios
        .get(process.env.VUE_APP_BASE_URL + "/api/v1/admin/feedback")
        .then((res) => {
          this.feedback = res.data
        })
    }
  },
  mounted() {
    this.getFeedback()
  }
}
</script>

<style scoped></style>
