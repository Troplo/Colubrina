<template>
  <span>
    <v-card
      :min-width="!$vuetify.breakpoint.mobile ? 400 : 0"
      :max-width="500"
      elevation="0"
      color="card"
      v-if="embed.type === 'image'"
    >
      <v-hover v-slot="{ hover }">
        <div>
          <v-img
            @click="setImagePreview(embed)"
            contain
            :max-width="500"
            :max-height="500"
            :min-height="250"
            :min-width="250"
            :src="$store.state.baseURL + embed.mediaProxyLink"
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular
                  indeterminate
                  color="grey lighten-5"
                ></v-progress-circular>
              </v-row>
            </template>
            <template v-slot:default>
              <v-fade-transition v-if="hover">
                <v-overlay absolute>
                  <v-icon large>mdi-arrow-expand-all</v-icon>
                </v-overlay>
              </v-fade-transition>
            </template>
          </v-img>
        </div>
      </v-hover>
    </v-card>
    <v-card
      v-if="embed.type !== 'image'"
      elevation="0"
      :color="embed.type === 'embed-v1' ? embed.backgroundColor : 'bg'"
      :max-width="400"
      :min-width="!$vuetify.breakpoint.mobile ? 300 : 0"
      class="ml-1 rounded-xl mb-1 mr-1"
    >
      <v-container fluid>
        <v-row v-if="embed.type === 'openGraph'">
          <v-col
            cols="12"
            class="text-xs-center"
            v-if="embed.openGraph.ogImage"
          >
            <v-img
              :src="
                embed.openGraph.ogImage?.url || embed.openGraph.ogImage[0]?.url
              "
              class="elevation-1"
              contain
              :aspect-ratio="16 / 9"
            >
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular
                    indeterminate
                    color="grey lighten-5"
                  ></v-progress-circular>
                </v-row>
              </template>
            </v-img>
          </v-col>
          <v-col cols="12" class="text-xs-center">
            <h4>
              {{ embed.openGraph.ogSiteName }}
            </h4>
            <a :href="embed.link" target="_blank" style="text-decoration: none">
              <h3>
                {{ embed.openGraph.ogTitle }}
              </h3>
            </a>
            <p v-if="embed.openGraph.ogDescription">
              {{ embed.openGraph.ogDescription }}
            </p>
          </v-col>
        </v-row>
        <v-row v-else-if="embed.type === 'embed-v1'">
          <v-col cols="12" class="text-xs-center" v-if="embed.headerImage">
            <v-img
              :src="
                embed.openGraph.headerImage?.url ||
                embed.openGraph.headerImage[0]?.url
              "
              class="elevation-1"
              contain
              :aspect-ratio="16 / 9"
            >
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular
                    indeterminate
                    color="grey lighten-5"
                  ></v-progress-circular>
                </v-row>
              </template>
            </v-img>
          </v-col>
          <v-col cols="12" class="text-xs-center">
            <h4 v-if="embed.title">
              {{ embed.title }}
            </h4>
            <p v-if="embed.description">
              {{ embed.description }}
            </p>
            <v-row
              v-for="(graph, index) in embed.graphs"
              :key="'graph-' + index"
            >
              <v-col cols="12" class="text-xs-center">
                <h3>
                  {{ graph.name }}
                </h3>
                <Chart
                  :chart-data="graph.data"
                  v-if="graph.data"
                  :options="graphOptions"
                ></Chart>
                <p v-else>Chart data could not be loaded.</p>
              </v-col>
            </v-row>
            <v-row
              v-for="(field, index) in embed.fields"
              :key="'field-' + index"
              :id="'field-' + index"
              class="mt-1"
            >
              <v-col
                cols="12"
                class="text-xs-center"
                style="white-space: pre-wrap"
              >
                <h4>{{ field.name }}</h4>
                <p>{{ field.value }}</p>
              </v-col>
            </v-row>
            <a
              :href="embed.link.url"
              v-if="embed.link"
              target="_blank"
              style="text-decoration: none"
            >
              <h3>
                {{ embed.link.title }}
              </h3>
            </a>
            <small v-if="embed.footer">
              {{ embed.footer }}
            </small>
          </v-col>
        </v-row>
        <v-row v-else>
          <v-container>
            <h4>You must update Colubrina to see this embed.</h4>
          </v-container>
        </v-row>
      </v-container>
    </v-card>
  </span>
</template>

<script>
import { Line as Chart } from "vue-chartjs/legacy"
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from "chart.js"

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
)

export default {
  name: "Embed",
  props: ["embed", "setImagePreview"],
  components: {
    Chart
  }
}
</script>

<style scoped></style>
