console.log("Initializing")
require("dotenv").config()
let express = require("express")
let app = express()
let bodyParser = require("body-parser")
let os = require("os")
const cookieParser = require("cookie-parser")
app.use(cookieParser())
app.set("trust proxy", true)
const socket = require("./lib/socket")
const server = require("http").createServer(app)

app.use(bodyParser.json({ limit: "15mb" }))
app.use(bodyParser.urlencoded({ extended: true }))

app.use("/api/v1/user", require("./routes/user.js"))
app.use("/api/v1/themes", require("./routes/theme.js"))
app.use("/api/v1/communications", require("./routes/communications.js"))
app.use("/api/v1/friends", require("./routes/friends.js"))
app.use("/api/v1/admin", require("./routes/admin.js"))
app.use("/usercontent", require("./routes/usercontent.js"))
app.use("/api/v1/usercontent", require("./routes/usercontent.js"))
app.use("/api/v1/mediaproxy", require("./routes/mediaproxy.js"))
app.use("/api/v1/associations", require("./routes/associations.js"))
app.get("/api/v1/state", async (req, res) => {
  res.json({
    release: process.env.RELEASE,
    loading: true,
    notification: process.env.NOTIFICATION,
    notificationType: process.env.NOTIFICATION_TYPE,
    latestVersion: require("../frontend/package.json").version,
    name: process.env.SITE_NAME,
    allowRegistrations: process.env.ALLOW_REGISTRATIONS === "true",
    publicUsers: process.env.PUBLIC_USERS === "true"
  })
})

app.all("/api/*", (req, res) => {
  res.status(404).json({
    message: "Route not found."
  })
})

console.log(os.hostname())

app.use(require("./lib/errorHandler"))

server.listen(23998, () => {
  console.log("Initialized")
  console.log("Listening on port 0.0.0.0:" + 23998)

  app.locals.appStarted = true
  app.emit("appStarted")
})

socket.init(app, server)

module.exports = app
