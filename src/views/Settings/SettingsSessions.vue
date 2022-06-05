<template>
  <div id="settings-sessions">
    <v-container fluid>
      <v-row>
        <v-col md="3" v-for="session in sessions" :key="session.id">
          <v-card class="mb-2 rounded-xl" color="card">
            <v-toolbar color="toolbar">
              <v-toolbar-title>{{
                session.other.osString || "Unknown Session"
              }}</v-toolbar-title>
            </v-toolbar>
            <v-container>
              <v-card-text>
                Browser: {{ session.other.browserString }}
              </v-card-text>
              <v-card-text
                >Login IP address: {{ session.other.ip }}
              </v-card-text>
              <v-card-text
                >Operating System: {{ session.other.osString }}
              </v-card-text>
              <v-card-text>
                Time of login:
                {{ $date(session.createdAt).format("DD/MM/YYYY hh:mm A") }}
              </v-card-text>
              <v-card-text>
                Expires:
                {{ $date(session.expiredAt).format("DD/MM/YYYY hh:mm A") }}
              </v-card-text>
              <v-card-text> Country: {{ session.other.location }} </v-card-text>
              <v-card-text> ISP: {{ session.other.isp }} </v-card-text>
              <v-card-actions>
                <v-btn @click="deleteSession(session.id)" color="error" text>
                  Invalidate
                </v-btn>
              </v-card-actions>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler"

export default {
  name: "SettingsSessions",
  data() {
    return {
      sessions: []
    }
  },
  methods: {
    deleteSession(id) {
      this.axios
        .delete("/api/v1/user/sessions/" + id)
        .then(() => {
          this.$toast.success("Session invalidated.")
          this.getSessions()
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    getSessions() {
      this.axios
        .get("/api/v1/user/sessions")
        .then((res) => {
          this.sessions = res.data
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    }
  },
  mounted() {
    this.getSessions()
  }
}
</script>

<style scoped></style>
