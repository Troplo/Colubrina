const { User, Theme, Session } = require("../models")
const { Op } = require("sequelize")

module.exports = async function (socket, next) {
  try {
    const token = socket.handshake.auth.token
    const session = await Session.findOne({
      where: {
        session: token,
        expiredAt: {
          [Op.gt]: new Date()
        }
      }
    })
    if (session) {
      const user = await User.findOne({
        where: { id: session.userId },
        attributes: {
          exclude: ["totp", "compassSession", "password"]
        },
        include: [
          {
            model: Theme,
            as: "themeObject"
          }
        ]
      })
      if (user) {
        await user.update({
          lastSeenAt: new Date().toISOString()
        })
        socket.user = user
        next()
      }
    } else {
      socket.user = {
        id: null,
        username: "Not Authenticated"
      }
      next()
    }
  } catch (error) {
    socket.user = {
      id: null,
      username: "Not Authenticated"
    }
    next()
  }
}
