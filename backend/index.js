console.log("Initializing")
require("dotenv").config()
let express = require("express")
let app = express()
let bodyParser = require("body-parser")
let os = require("os")
app.set("trust proxy", true)
app.locals.config = require("./config/config.json")
const socket = require("./lib/socket")
const { User } = require("./models")
const { Op } = require("sequelize")
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
    release: req.app.locals.config.release,
    notification: req.app.locals.config.notification,
    notificationType: req.app.locals.config.notificationType,
    latestVersion: require("../frontend/package.json").version,
    allowRegistrations: req.app.locals.config.allowRegistrations,
    publicUsers: req.app.locals.config.publicUsers,
    emailVerification: req.app.locals.config.emailVerification,
    rules: req.app.locals.config.rules,
    name: req.app.locals.config.siteName,
    loading: true,
    isColubrinaServer: true
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
  User.update(
    {
      status: "offline"
    },
    {
      where: {
        status: {
          [Op.ne]: "offline"
        }
      }
    }
  )
  console.log("Initialized")
  console.log("Listening on port 0.0.0.0:" + 23998)

  app.locals.appStarted = true
  app.emit("appStarted")
})

socket.init(app, server)

module.exports = app
