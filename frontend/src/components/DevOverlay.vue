<template>
  <div class="dev-overlay" id="dev-overlay">
    <div class="dev-header" id="dev-header">Colourbrina DevTools</div>
    <v-container>
      <v-btn @click="benchmark"
        >Benchmark
        <template v-if="isBenchmarking">({{ multiplier }}x)</template></v-btn
      ><br />
      <template v-if="isBenchmarking"
        >Please restart the Colourbrina server to stop the benchmark.</template
      ><br />
      <v-btn @click="deleteBenchmark">Delete benchuser messages</v-btn>
    </v-container>
  </div>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler.js"
export default {
  name: "DevOverlay",
  data() {
    return {
      isBenchmarking: false,
      multiplier: 0
    }
  },
  methods: {
    deleteBenchmark() {
      this.axios.delete("/api/v1/debug/bench").catch((e) => {
        AjaxErrorHandler(this.$store)(e)
      })
    },
    benchmark() {
      this.axios
        .get("/api/v1/debug/bench")
        .then(() => {
          this.isBenchmarking = true
          this.multiplier += 1
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    },
    drag(element) {
      let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0
      if (document.getElementById("dev-header")) {
        // if present, the header is where you move the DIV from:
        document.getElementById("dev-header").onmousedown = dragMouseDown
      } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        element.onmousedown = dragMouseDown
      }

      function dragMouseDown(e) {
        e = e || window.event
        e.preventDefault()
        // get the mouse cursor position at startup:
        pos3 = e.clientX
        pos4 = e.clientY
        document.onmouseup = closeDragElement
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag
      }

      function elementDrag(e) {
        e = e || window.event
        e.preventDefault()
        pos1 = pos3 - e.clientX
        pos2 = pos4 - e.clientY
        pos3 = e.clientX
        pos4 = e.clientY
        element.style.top = element.offsetTop - pos2 + "px"
        element.style.left = element.offsetLeft - pos1 + "px"
      }

      function closeDragElement() {
        document.onmouseup = null
        document.onmousemove = null
      }
    }
  },
  mounted() {
    this.drag(document.getElementById("dev-overlay"))
  }
}
</script>

<style scoped></style>
