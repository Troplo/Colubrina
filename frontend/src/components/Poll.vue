<template>
  <v-card
    elevation="0"
    :max-width="500"
    :min-width="!$vuetify.breakpoint.mobile ? 400 : 200"
    class="ml-1 mb-1 mr-1 rounded-l"
    color="card lighten-1"
  >
    <v-toolbar color="toolbar" height="45">
      <v-toolbar-title> Poll: {{ message.poll.title }} </v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      {{ message.poll.description }}
      <v-progress-linear
        v-for="option in message.poll.options"
        :key="option.id"
        block
        class="mb-1 rounded-xl"
        height="30"
        text
        :value="
          percentageVotes.find((percentage) => percentage.id === option.id)
            .percentage
        "
        color="success darken-1"
        background-opacity="0.2"
        outlined
        style="text-transform: none; cursor: pointer"
        @click="votePoll(option.id)"
      >
        <span style="float: left !important">
          <v-icon v-if="option.id === myVote?.answer">
            mdi-check-circle
          </v-icon>
          {{ option.value }} ({{
            percentageVotes.find((percentage) => percentage.id === option.id)
              .percentage
          }}% /
          {{
            message.poll.answers.filter((answer) => answer.answer === option.id)
              ?.length || 0
          }})
        </span>
      </v-progress-linear>
      {{ message.poll.answers.length }} votes
    </v-card-text>
  </v-card>
</template>

<script>
import AjaxErrorHandler from "@/lib/errorHandler.js"

export default {
  name: "Poll",
  props: ["message"],
  computed: {
    myVote() {
      return this.message.poll.answers.find(
        (vote) => vote.userId === this.$store.state.user.id
      )
    },
    percentageVotes() {
      return this.message.poll.options.map((option) => {
        return {
          id: option.id,
          percentage: Math.round(
            ((this.message.poll.answers?.filter(
              (answer) => answer?.answer === option.id
            ).length || 0) /
              this.message.poll.answers.length) *
              100 || 0
          )
        }
      })
    }
  },
  methods: {
    votePoll(option) {
      this.axios
        .post(`/api/v1/polls/${this.message.poll.id}/vote`, {
          option
        })
        .catch((e) => {
          AjaxErrorHandler(this.$store)(e)
        })
    }
  },
  mounted() {
    this.$socket.on(`pollAnswer-${this.message.id}`, (data) => {
      this.message.poll.answers = this.message.poll.answers.filter(
        (answer) => answer.id !== data.id
      )
      if (data.answer) {
        this.message.poll.answers.push(data.answer)
      }
    })
  }
}
</script>

<style scoped></style>
