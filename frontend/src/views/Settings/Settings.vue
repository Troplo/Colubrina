<template>
  <div id="settings">
    <v-container v-if="$store.state.user" fluid>
      <v-card color="card" elevation="7" class="rounded-xl">
        <v-toolbar color="toolbar">
          <v-toolbar-title>{{ $route.name }} </v-toolbar-title>
        </v-toolbar>
        <v-tabs background-color="transparent">
          <v-tab to="/settings/site"> General </v-tab>
          <v-tab to="/settings/appearance"> Appearance </v-tab>
          <v-tab to="/settings/communications"> Communications </v-tab>
          <v-tab to="/settings/security"> Security </v-tab>
          <v-tab to="/settings/sessions"> Sessions </v-tab>
        </v-tabs>
        <router-view />
        <div class="mx-4">
          <small
            >Troplo/Colubrina version {{ $store.state.versioning.version }},
            built on {{ $store.state.versioning.date }}</small
          >
        </div>
      </v-card>
    </v-container>
  </div>
</template>
<script>
export default {
  name: "Settings"
}
</script>

<style scoped></style>
