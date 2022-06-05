<template>
  <div></div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler"

export default {
  name: "AdminLogs",
  data() {
    return {
      logLines: []
    }
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
  },
  mounted() {
    this.getLogs()
  }
}
</script>

<style scoped></style>
