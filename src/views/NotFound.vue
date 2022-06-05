<template>
  <div id="not-found">
    <v-container>
      <v-card color="card" class="rounded-xl">
        <v-toolbar color="toolbar">
          <v-spacer></v-spacer>
          <v-toolbar-title> Not Found </v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-container class="text-center justify-center">
          <h1>The page you were looking for couldn't be found.</h1>
          <v-btn color="primary" text to="/">Home</v-btn>
        </v-container>
      </v-card>
    </v-container>
  </div>
</template>

<script>
export default {
  name: "NotFound"
}
</script>

<style scoped></style>
