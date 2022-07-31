const { User, Theme, Session } = require("../models")

const parseCookie = (str) =>
  str
    .split(";")
    .map((v) => v.split("="))
    .reduce((acc, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim())
      return acc
    }, {})
module.exports = async function (socket, next) {
  try {
    const cookies = parseCookie(socket.handshake.headers.cookie)
    if (cookies["session"]) {
      const session = await Session.findOne({
        where: { session: cookies["session"] }
      })
      if (session) {
        const user = await User.findOne({
          where: { id: session.userId },
          attributes: {
            exclude: ["totp", "password", "emailToken"]
          },
          include: [
            {
              model: Theme,
              as: "themeObject"
            }
          ],
          raw: true
        })
        if (user) {
          if (user.banned) {
            socket.user = {
              id: null,
              username: "Not Authenticated"
            }
            next()
          } else {
            socket.user = user
            next()
          }
        }
      } else {
        socket.user = {
          id: null,
          username: "Not Authenticated"
        }
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
