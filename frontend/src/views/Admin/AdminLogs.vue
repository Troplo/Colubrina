<template>
  <div></div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler.js"

export default {
  name: "AdminLogs",
  data() {
    return {
      logLines: []
    }
  },
  mounted() {
    this.getLogs()
  },
  methods: {
    getLogs() {
      this.axios
        .get("/api/v1/admin/logs")
        .then((res) => {
          this.logLines = res.data
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    }
  }
}
</script>

<style scoped></style>
