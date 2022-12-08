import Vue from "vue"
import App from "./App.vue"
import router from "./router"
import store from "./store"
import vuetify from "./plugins/vuetify"
import axios from "axios"
import VueAxios from "vue-axios"
import Toast from "vue-toastification"
import "./assets/styles.css"
import "vue-toastification/dist/index.css"
import "./registerServiceWorker"
import "@mdi/font/css/materialdesignicons.css"
import "./plugins/dayjs"
import SocketIO from "socket.io-client"
import twemoji from "twemoji"
import VueNativeNotification from "vue-native-notification"
import "highlight.js/styles/github.css"
const md = require("markdown-it")({
  html: false, // Enable HTML tags in source
  xhtmlOut: false, // Use '/' to close single tags (<br />).
  breaks: true, // Convert '\n' in paragraphs into <br>
  langPrefix: "language-", // CSS language prefix for fenced blocks. Can be
  linkify: true, // Autoconvert URL-like text to links
  typographer: false,

  quotes: "“”‘’",

  highlight: function (/*str, lang*/) {
    return ""
  }
}).disable(["image", "autolink", "list"])
const emoji = require("markdown-it-emoji")
const defaultRender =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }
md.use(emoji)
const hljs = require("highlight.js/lib/core")
md.use(require("markdown-it-highlightjs"), { hljs })
md.renderer.rules.emoji = function (token, idx) {
  return twemoji.parse(token[idx].content, {
    folder: "svg",
    ext: ".svg"
  })
}
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // If you are sure other plugins can't add `target` - drop check below
  const aIndex = tokens[idx].attrIndex("target")

  if (aIndex < 0) {
    tokens[idx].attrPush(["target", "_blank"]) // add new attribute
  } else {
    tokens[idx].attrs[aIndex][1] = "_blank" // replace value of existing attr
  }

  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self)
}

Vue.use(VueNativeNotification, {
  requestOnNotify: false
})

Vue.use({
  install(Vue) {
    Vue.prototype.$socket = SocketIO(
      localStorage.getItem("instance") || process.env.VUE_APP_SOCKET_URL,
      {
        transports: ["websocket", "polling"],
        headers: {
          Authorization: localStorage.getItem("token")
        },
        auth: {
          token: localStorage.getItem("token")
        }
      }
    )
  }
})

Vue.use(require("vue-shortkey"))
Vue.config.productionTip = false
Vue.use(VueAxios, axios)
Vue.use(Toast)
Vue.directive("markdown", {
  inserted(el) {
    el.innerHTML = md
      .render(el.innerHTML)
      .replaceAll("&amp;", "&")
      .replaceAll("<p>", "<span>")
      .replaceAll("</p>", "</span>")
  }
})
if (process.env.NODE_ENV === "development") {
  console.log("Colourbrina is running in development mode.")
  Vue.config.performance = true
}
new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App)
}).$mount("#app")
