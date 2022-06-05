const auth = require("../lib/authorize_socket.js")
const { User, Friend } = require("../models")
module.exports = {
  init(app, server) {
    const io = require("socket.io")(server, {
      cors: {
        origin: [process.env.CORS_HOSTNAME],
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
      socket.join(user.id)
      socket.emit("siteState", {
        release: process.env.RELEASE,
        notification: process.env.NOTIFICATION,
        notificationType: process.env.NOTIFICATION_TYPE,
        latestVersion: require("../../package.json").version
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
        friends.forEach((friend) => {
          io.to(friend.friendId).emit("userStatus", {
            userId: user.id,
            status: "offline"
          })
        })
        await user.update({
          status: "offline"
        })
      })
    })
    console.log("WS OK")
    app.set("io", io)
  }
}
