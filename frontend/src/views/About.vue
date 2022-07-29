<template>
  <div id="about">
    <v-container>
      <v-card color="card" class="rounded-xl" elevation="7">
        <v-container class="text-center justify-center">
          <h1
            v-if="$vuetify.breakpoint.mdAndUp"
            class="troplo-title"
            style="font-size: 100px"
          >
            Colubrina
          </h1>
          <h1
            v-if="$vuetify.breakpoint.smAndDown"
            class="troplo-title"
            style="font-size: 40px"
          >
            Colubrina
          </h1>
          <p class="subheading">
            Colubrina is a simple open source chatting platform.
          </p>
          <p class="subheading">
            Created by Troplo, if you like this project, please star it on
            GitHub.
          </p>
          <v-btn
            text
            type="info"
            fab
            href="https://github.com/Troplo/Colubrina"
            target="_blank"
          >
            <v-icon> mdi-github </v-icon> </v-btn
          ><br />
          <small
            >Troplo/Colubrina version: {{ $store.state.versioning.version }},
            built on: {{ $store.state.versioning.date }}</small
          >
        </v-container>
      </v-card>
    </v-container>
  </div>
</template>

<script>
export default {
  name: "About"
}
</script>
