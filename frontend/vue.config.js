const WebpackAutoInject = require("webpack-auto-inject-version-next")
const Dotenv = require("dotenv-webpack")
//const SentryPlugin = require("@sentry/webpack-plugin")
let plugins

if (process.env.NODE_ENV === "production") {
  plugins = [
    /*new SentryPlugin({
      release: process.env.RELEASE,
      include: "./dist"
    }),*/
    new Dotenv(),
    new WebpackAutoInject({
      // specify the name of the tag in the outputed files eg
      // bundle.js: [SHORT] Version: 0.13.36 ...
      SHORT: "Troplo Versioning [Colubrina]",
      SILENT: true,
      PACKAGE_JSON_PATH: "./package.json",
      PACKAGE_JSON_INDENT: 2,
      components: {
        AutoIncreaseVersion: true,
        InjectAsComment: true,
        InjectByTag: true
      },
      componentsOptions: {
        AutoIncreaseVersion: {
          runInWatchMode: true // it will increase version with every single build!
        },
        InjectAsComment: {
          tag: "Version information: {version}, Build Date: {date}",
          dateFormat: "dd/mm/yyyy; hh:MM:ss TT", // change timezone: `UTC:h:MM:ss` or `GMT:h:MM:ss`
          multiLineCommentType: false // use `/** */` instead of `//` as comment block
        },
        InjectByTag: {
          fileRegex: /\.+/,
          AIVTagRegexp: /(\[AIV])(([a-zA-Z{} ,:;!()_@\-"'\\/])+)(\[\/AIV])/g,
          dateFormat: "dd/mm/yyyy; hh:MM:ss TT"
        }
      },
      LOGS_TEXT: {
        AIS_START: "Troplo Colubrina AIV started"
      }
    })
  ]
} else {
  plugins = [
    new Dotenv(),
    new WebpackAutoInject({
      // specify the name of the tag in the outputed files eg
      // bundle.js: [SHORT] Version: 0.13.36 ...
      SHORT: "Troplo Versioning [Colubrina]",
      SILENT: true,
      PACKAGE_JSON_PATH: "./package.json",
      PACKAGE_JSON_INDENT: 2,
      components: {
        AutoIncreaseVersion: true,
        InjectAsComment: true,
        InjectByTag: true
      },
      componentsOptions: {
        AutoIncreaseVersion: {
          runInWatchMode: true // it will increase version with every single build!
        },
        InjectAsComment: {
          tag: "Version information: {version}, Build Date: {date}",
          dateFormat: "dd/mm/yyyy; hh:MM:ss TT", // change timezone: `UTC:h:MM:ss` or `GMT:h:MM:ss`
          multiLineCommentType: false // use `/** */` instead of `//` as comment block
        },
        InjectByTag: {
          fileRegex: /\.+/,
          AIVTagRegexp: /(\[AIV])(([a-zA-Z{} ,:;!()_@\-"'\\/])+)(\[\/AIV])/g,
          dateFormat: "dd/mm/yyyy; hh:MM:ss TT"
        }
      },
      LOGS_TEXT: {
        AIS_START: "Troplo Colubrina AIV started"
      }
    })
  ]
}
module.exports = {
  chainWebpack: (config) => {
    config.module
      .rule("vue")
      .use("vue-loader")
      .tap((options) => {
        options.compiler = require("vue-template-babel-compiler")
        return options
      })
  },
  productionSourceMap: true,
  configureWebpack: {
    plugins
  },
  pwa: {
    workboxOptions: {
      skipWaiting: true
    },
    name: "Colubrina",
    themeColor: "#181818",
    msTileColor: "#181818",
    appleMobileWebAppCapable: "yes",
    appleMobileWebAppStatusBarStyle: "black",
    mobileWebAppCapable: "yes",
    icons: [
      {
        src: "./img/icons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "./img/icons/android-chrome-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "./img/icons/android-chrome-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "./img/icons/apple-touch-icon-60x60.png",
        sizes: "60x60",
        type: "image/png"
      },
      {
        src: "./img/icons/apple-touch-icon-76x76.png",
        sizes: "76x76",
        type: "image/png"
      },
      {
        src: "./img/icons/apple-touch-icon-120x120.png",
        sizes: "120x120",
        type: "image/png"
      },
      {
        src: "./img/icons/apple-touch-icon-152x152.png",
        sizes: "152x152",
        type: "image/png"
      },
      {
        src: "./img/icons/apple-touch-icon-180x180.png",
        sizes: "180x180",
        type: "image/png"
      },
      {
        src: "./img/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      },
      {
        src: "./img/icons/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png"
      },
      {
        src: "./img/icons/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png"
      },
      {
        src: "./img/icons/msapplication-icon-144x144.png",
        sizes: "144x144",
        type: "image/png"
      },
      {
        src: "./img/icons/mstile-150x150.png",
        sizes: "150x150",
        type: "image/png"
      }
    ]
  },
  devServer: {
    proxy: "http://localhost:23998"
  },
  transpileDependencies: ["vuetify"]
}
