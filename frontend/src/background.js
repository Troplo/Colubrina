"use strict"

const electron = require("electron")
const VueCLI = require("vue-cli-plugin-electron-builder/lib")
const {
  default: installExtension,
  VUEJS_DEVTOOLS
} = require("electron-devtools-installer")
const isDevelopment = process.env.NODE_ENV !== "production"
const windowStateKeeper = require("electron-window-state")

// Scheme must be registered before the app is ready
electron.protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const { bounds } = electron.screen.getDisplayNearestPoint(
    electron.screen.getCursorScreenPoint()
  )
  const height = Math.floor(bounds.height * (2 / 3))
  const width = Math.floor(bounds.width * (2 / 3))
  const y = Math.floor(bounds.y + (bounds.height - height) / 2)
  const x = Math.floor(bounds.x + (bounds.width - width) / 2)
  let mainWindowState = windowStateKeeper({
    defaultWidth: width,
    defaultHeight: height,
    x: x,
    y: y
  })
  const win = new electron.BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      preload: "window-preload.js",
      // required for multi-instance support
      webSecurity: false,
      // Auto-scroll for Linux/MacOS
      enableBlinkFeatures: "MiddleClickAutoscroll"
    }
  })
  mainWindowState.manage(win)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    VueCLI.createProtocol("app")
    // Load the index.html when not in development
    win.loadURL("app://./index.html")
  }
}

// Quit when all windows are closed.
electron.app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    electron.app.quit()
  }
})

electron.app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (electron.BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron.app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        electron.app.quit()
      }
    })
  } else {
    process.on("SIGTERM", () => {
      electron.app.quit()
    })
  }
}
