const auth = require("../lib/authorize_socket.js")
const { User, Friend, Session, Theme } = require("../models")
const { Op } = require("sequelize")
module.exports = {
  init(app, server) {
    const io = require("socket.io")(server, {
      cors: {
        origin: [app.locals.config.corsHostname],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
      }
    })
    io.use(auth)
    io.on("connection", async (socket) => {
      const user = await User.findOne({
        where: {
          id: socket.user.id
        }
      })
      if (user && socket.user.id) {
        console.log(socket.user.id)
        socket.join(user.id)
        socket.emit("siteState", {
          release: app.locals.config.release,
          notification: app.locals.config.notification,
          notificationType: app.locals.config.notificationType,
          latestVersion: require("../../frontend/package.json").version,
          allowRegistrations: app.locals.config.allowRegistrations,
          publicUsers: app.locals.config.publicUsers,
          emailVerification: app.locals.config.emailVerification,
          rules: app.locals.config.rules,
          name: app.locals.config.siteName
        })
        const friends = await Friend.findAll({
          where: {
            userId: user.id,
            status: "accepted"
          }
        })
        await user.update({
          status:
            user.storedStatus === "invisible" ? "offline" : user.storedStatus
        })
        friends.forEach((friend) => {
          io.to(friend.friendId).emit("userStatus", {
            userId: user.id,
            status:
              user.storedStatus === "invisible" ? "offline" : user.storedStatus
          })
        })
        socket.on("ping", () => {
          socket.emit("pong")
        })
        socket.on("bcBots/deleteMessage", (e) => {
          if (socket.user.bot) {
            socket.to(e.userId).emit("deleteMessage", e)
          } else {
            socket.emit("bcBots/deleteMessage", {
              error: "You cannot perform this action."
            })
          }
        })
        socket.on("idle", async () => {
          const user = await User.findOne({
            where: {
              id: socket.user.id
            }
          })
          if (user.storedStatus === "online") {
            friends.forEach((friend) => {
              io.to(friend.friendId).emit("userStatus", {
                userId: user.id,
                status: "away"
              })
            })
            io.to(user.id).emit("userStatus", {
              userId: user.id,
              status: "away"
            })
            await user.update({
              status: "away"
            })
          }
        })
        socket.on("online", async () => {
          const user = await User.findOne({
            where: {
              id: socket.user.id
            }
          })
          if (user.storedStatus === "online") {
            friends.forEach((friend) => {
              io.to(friend.friendId).emit("userStatus", {
                userId: user.id,
                status: "online"
              })
            })
            io.to(user.id).emit("userStatus", {
              userId: user.id,
              status: "online"
            })
            await user.update({
              status: "online"
            })
          }
        })
        socket.on("disconnect", async function () {
          const clients = io.sockets.adapter.rooms.get(user.id) || new Set()
          if (!clients.size || clients.size === 0) {
            friends.forEach((friend) => {
              io.to(friend.friendId).emit("userStatus", {
                userId: user.id,
                status: "offline"
              })
            })
            await user.update({
              status: "offline"
            })
          }
        })
      } else {
        socket.join(-1)
        socket.emit("siteState", {
          release: app.locals.config.release,
          notification: app.locals.config.notification,
          notificationType: app.locals.config.notificationType,
          latestVersion: require("../../frontend/package.json").version,
          allowRegistrations: app.locals.config.allowRegistrations,
          publicUsers: app.locals.config.publicUsers,
          emailVerification: app.locals.config.emailVerification,
          rules: app.locals.config.rules,
          name: app.locals.config.siteName
        })
        socket.emit("unauthorized", {
          message: "Please reauth."
        })
        socket.on("token", async () => {
          socket.emit("unsupported", {
            message: "This authentication method is unsupported."
          })
        })
        console.log("Unauthenticated user")
        socket.on("reAuth", async () => {
          socket.disconnect()
        })
      }
    })
    console.log("WS OK")
    app.set("io", io)
  }
}
