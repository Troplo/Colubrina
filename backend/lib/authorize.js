const { User, Theme, Session } = require("../models")
const Errors = require("./errors")
const { Op } = require("sequelize")
module.exports = async function (req, res, next) {
  try {
    if (req.header("Authorization") && req.header("Authorization") !== "null") {
      const token = req.header("Authorization")
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
            exclude: ["totp", "password", "emailToken"]
          },
          include: [
            {
              model: Theme,
              as: "themeObject"
            }
          ]
        })
        if (user) {
          if (user.banned) {
            res.status(401).json({ errors: [Errors.banned] })
            return
          }
          await user.update({
            lastSeenAt: new Date().toISOString()
          })
          req.user = user
          next()
        }
      } else {
        res.status(401).json({ errors: [Errors.unauthorized] })
      }
    } else {
      res.status(401).json({
        errors: [
          {
            message: "You need to be logged in."
          }
        ]
      })
    }
  } catch (e) {
    console.log(e)
  }
}
