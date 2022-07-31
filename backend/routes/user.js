const express = require("express")
const router = express.Router()
const Errors = require("../lib/errors.js")
const auth = require("../lib/authorize.js")
const axios = require("axios")
const { User, Session, Theme, Friend, Attachment } = require("../models")
const cryptoRandomString = require("crypto-random-string")
const { Op } = require("sequelize")
const speakeasy = require("speakeasy")
const argon2 = require("argon2")
const UAParser = require("ua-parser-js")
const fs = require("fs")
const path = require("path")
const semver = require("semver")
const multer = require("multer")
const FileType = require("file-type")
const rateLimit = require("express-rate-limit")
const Mailgen = require("mailgen")
const nodemailer = require("nodemailer")

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "usercontent/")
  },
  filename: function (req, file, cb) {
    cb(
      null,
      cryptoRandomString({ length: 32 }) + path.extname(file.originalname)
    )
  }
})

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 2,
  message: Errors.rateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  keyGenerator: (req, res) => req.user?.id || req.ip
})

const mailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: Errors.rateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  keyGenerator: (req, res) => req.user?.id || req.ip
})

const whitelist = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif"
]

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!whitelist.includes(file.mimetype)) {
      return cb(new Error("Only images are allowed"))
    }

    cb(null, true)
  }
})

router.post("/verify/resend", auth, mailLimiter, async (req, res, next) => {
  try {
    if (process.env.EMAIL_VERIFICATION !== "true") {
      throw Errors.invalidParameter("Email verification is disabled")
    }
    const token = "COLUBRINA-VERIFY-" + cryptoRandomString({ length: 64 })
    await req.user.update({
      emailToken: token
    })
    const mailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: process.env.SITE_NAME,
        link: process.env.CORS_HOSTNAME
      }
    })
    const email = {
      body: {
        name: req.user.username,
        intro: `${process.env.SITE_NAME} Account Verification`,
        action: {
          instructions: `You are receiving this email because you registered on ${process.env.SITE_NAME}, please use the link below to verify your account.`,
          button: {
            color: "#1A97FF",
            text: "Account Verification",
            link: process.env.CORS_HOSTNAME + "/email/confirm/" + token
          }
        },
        outro: "If you did not register, please disregard this email."
      }
    }
    const emailBody = mailGenerator.generate(email)

    const emailText = mailGenerator.generatePlaintext(email)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: process.env.EMAIL_SMTP_PORT,
      secure: JSON.parse(process.env.EMAIL_SMTP_SECURE.toLowerCase()),
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASSWORD
      }
    })
    let info = await transporter.sendMail({
      from: process.env.EMAIL_SMTP_FROM,
      to: req.user.email,
      subject: "Email Verification - " + process.env.SITE_NAME,
      text: emailText,
      html: emailBody
    })
    if (info) {
      res.json({ success: true })
    } else {
      throw Errors.mailFail
    }
  } catch (e) {
    next(e)
  }
})

router.post("/verify/confirm/:token", auth, async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.user.id
      }
    })
    if (process.env.EMAIL_VERIFICATION !== "true") {
      throw Errors.invalidParameter("Email verification is disabled")
    }
    if (!req.params.token) {
      throw Errors.invalidToken
    }
    if (req.params.token !== user.emailToken) {
      throw Errors.invalidToken
    }
    await user.update({
      emailVerified: true,
      emailToken: null
    })
    res.json({ success: true })
  } catch (e) {
    next(e)
  }
})

router.post("/login", async (req, res, next) => {
  async function checkPassword(password, hash) {
    try {
      return await argon2.verify(hash, password)
    } catch {
      console.log("Error")
      return false
    }
  }
  async function generateSession(user) {
    try {
      const ua = UAParser(req.headers["user-agent"])
      let ip = {}
      await axios
        .get("http://ip-api.com/json/ " + req.ip)
        .then((res) => {
          ip = res.data
        })
        .catch(() => {})
      const session = await Session.create({
        userId: user.id,
        session: "COLUBRINA-" + cryptoRandomString({ length: 128 }),
        expiredAt: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30),
        other: {
          ip: req.ip,
          location: ip.country
            ? `${ip.city} - ${ip.regionName} - ${ip.country}`
            : null,
          isp: ip.isp,
          asn: ip.as,
          browserString: ua.browser.name + " v" + ua.browser.major,
          osString: ua.os.name + " " + ua.os.version,
          browser: ua.browser.name,
          browserVersion: ua.browser.version,
          browserVersionMajor: ua.browser.major,
          os: ua.os.name,
          osVersion: ua.os.version
        }
      })
      res.cookie("session", session.session, {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
        secure: true,
        sameSite: "strict"
      })
      res.json({
        session: session.session,
        success: true,
        userId: user.id
      })
    } catch (e) {
      console.log(e)
      return false
    }
  }
  try {
    const user = await User.findOne({
      where: {
        username: req.body.username || ""
      }
    })
    if (user) {
      if (user.banned) throw Errors.banned
      if (await checkPassword(req.body.password, user.password)) {
        if (user.totpEnabled) {
          const verified = speakeasy.totp.verify({
            secret: user.totp,
            encoding: "base32",
            token: req.body.totp || ""
          })
          if (verified) {
            await generateSession(user)
          } else {
            throw Errors.invalidTotp
          }
        } else {
          await generateSession(user)
        }
      } else {
        throw Errors.invalidCredentials
      }
    } else {
      throw Errors.invalidCredentials
    }
  } catch (err) {
    next(err)
  }
})

router.post("/register", limiter, async (req, res, next) => {
  async function generatePassword(password) {
    try {
      return await argon2.hash(password)
    } catch {
      console.log("Error")
      return false
    }
  }
  async function generateSession(user) {
    try {
      const ua = UAParser(req.headers["user-agent"])
      let ip = {}
      await axios
        .get("http://ip-api.com/json/ " + req.ip)
        .then((res) => {
          ip = res.data
        })
        .catch(() => {})
      const session = await Session.create({
        userId: user.id,
        session: "COLUBRINA-" + cryptoRandomString({ length: 128 }),
        expiredAt: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30),
        other: {
          ip: req.ip,
          location: ip.country
            ? `${ip.city} - ${ip.regionName} - ${ip.country}`
            : null,
          isp: ip.isp,
          asn: ip.as,
          browserString: ua.browser.name + " v" + ua.browser.major,
          osString: ua.os.name + " " + ua.os.version,
          browser: ua.browser.name,
          browserVersion: ua.browser.version,
          browserVersionMajor: ua.browser.major,
          os: ua.os.name,
          osVersion: ua.os.version
        }
      })
      res.cookie("session", session.session, {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
        secure: true,
        sameSite: "strict"
      })
      res.json({
        session: session.session,
        success: true,
        userId: user.id
      })
    } catch (e) {
      console.log(e)
      return false
    }
  }
  try {
    if (process.env.ALLOW_REGISTRATIONS !== "true") {
      throw Errors.registrationsDisabled
    }
    if (req.body.password.length < 8) {
      throw Errors.invalidPassword
    }
    const user = await User.create({
      username: req.body.username,
      password: await generatePassword(req.body.password),
      theme: "dark",
      themeId: 1,
      guidedWizard: true,
      name: req.body.username,
      admin: false,
      email: req.body.email,
      font: "Inter",
      status: "offline",
      storedStatus: "online",
      experiments: [],
      avatar: null
    })
    if (user) {
      await generateSession(user)
    } else {
      throw Errors.unknown
    }
  } catch (err) {
    next(err)
  }
})

router.get("/", auth, (req, res, next) => {
  try {
    res.json(req.user)
  } catch {}
})

router.get("/sessions", auth, async (req, res, next) => {
  try {
    const sessions = await Session.findAll({
      where: {
        userId: req.user.id
      },
      attributes: {
        exclude: ["session"]
      }
    })
    res.json(sessions)
  } catch (e) {
    next(e)
  }
})

router.delete("/sessions/:id", auth, async (req, res, next) => {
  try {
    await Session.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    })
    res.sendStatus(204)
  } catch (e) {
    next(e)
  }
})

router.post("/logout", (req, res, next) => {
  try {
    res.clearCookie("session")
    res.sendStatus(204)
  } catch (e) {
    next(e)
  }
})

router.post(
  "/settings/avatar",
  auth,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const io = req.app.get("io")
      if (req.file) {
        const meta = await FileType.fromFile(req.file.path)
        if (!whitelist.includes(meta.mime)) {
          throw Errors.invalidFileType
        }
        const attachment = await Attachment.create({
          userId: req.user.id,
          type: "avatar",
          attachment: req.file.filename,
          name: req.file.originalname,
          extension: meta.ext,
          size: req.file.size
        })
        await User.update(
          {
            avatar: attachment.attachment
          },
          {
            where: {
              id: req.user.id
            }
          }
        )
        res.json(attachment)
        const friends = await Friend.findAll({
          where: {
            userId: req.user.id
          }
        })
        io.to(req.user.id).emit("userSettings", {
          userId: req.user.id,
          avatar: attachment.attachment,
          status: req.body.status === "invisible" ? "offline" : req.body.status,
          storedStatus: req.body.status
        })
        friends.forEach((friend) => {
          io.to(friend.id).emit("userSettings", {
            userId: req.user.id,
            avatar: attachment.attachment,
            status:
              req.body.status === "invisible" ? "offline" : req.body.status,
            storedStatus: req.body.status
          })
        })
      } else {
        throw Errors.invalidParameter("avatar")
      }
    } catch (e) {
      next(e)
    }
  }
)
router.put("/settings/:type", auth, async (req, res, next) => {
  async function checkPasswordArgon2(password, hash) {
    try {
      return await argon2.verify(hash, password)
    } catch {
      console.log("Error")
      return false
    }
  }
  try {
    const io = req.app.get("io")
    if (req.params.type === "full") {
      await User.update(
        {
          theme: req.body.theme,
          guidedWizard: req.body.guidedWizard,
          font: req.body.font,
          experiments: req.body.experiments,
          username: req.body.username,
          email: req.body.email
        },
        {
          where: {
            id: req.user.id
          }
        }
      )
      res.sendStatus(204)
    } else if (req.params.type === "theme") {
      const theme = await Theme.findOne({
        where: {
          id: req.body.id,
          [Op.or]: [
            {
              userId: req.user.id
            },
            {
              public: true
            }
          ]
        }
      })
      if (theme) {
        await User.update(
          {
            themeId: theme.id,
            accentColor: req.body.accent
          },
          {
            where: {
              id: req.user.id
            }
          }
        )
        res.sendStatus(204)
      } else {
        throw Errors.invalidParameter("Theme", "Invalid theme specified")
      }
    } else if (req.params.type === "totp") {
      if (req.user.totpEnabled && req.body.code) {
        res.json({ enabled: true })
      } else if (!req.user.totpEnabled && req.body.password) {
        const match = await checkPassword(req.body.password)
        if (match) {
          const token = speakeasy.generateSecret({
            name: "Colubrina - " + req.user.username,
            issuer: "Colubrina"
          })
          await User.update(
            {
              totp: token.base32
            },
            {
              where: {
                id: req.user.id
              }
            }
          )
          res.json({ secret: token.base32, enabled: false })
        } else {
          throw Errors.invalidCredentials
        }
      } else {
        throw Errors.invalidParameter("Password or Code")
      }
    } else if (req.params.type === "password") {
      const user = await User.findOne({
        where: {
          id: req.user.id
        }
      })
      let match
      if (user.password) {
        match = await checkPasswordArgon2(req.body.password)
      } else {
        match = true
      }
      if (match) {
        await user.update({
          password: await argon2.hash(req.body.new)
        })
        res.sendStatus(204)
      } else {
        throw Errors.invalidCredentials
      }
    } else if (req.params.type === "communications") {
      const user = await User.findOne({
        where: {
          id: req.user.id
        }
      })
      await user.update({
        privacy: {
          communications: {
            enabled: req.body.enabled,
            outsideTenant: req.body.outsideTenant,
            directMessages: req.body.directMessages,
            friendRequests: req.body.friendRequests
          }
        }
      })
      res.sendStatus(204)
    } else if (req.params.type === "status") {
      const user = await User.findOne({
        where: {
          id: req.user.id
        }
      })
      if (!["online", "away", "busy", "invisible"].includes(req.body.status)) {
        res.json({
          status: user.status,
          storedStatus: user.storedStatus
        })
      } else {
        await user.update({
          storedStatus: req.body.status,
          status: req.body.status === "invisible" ? "offline" : req.body.status
        })
        const friends = await Friend.findAll({
          where: {
            userId: user.id,
            status: "accepted"
          }
        })
        friends.forEach((friend) => {
          io.to(friend.friendId).emit("userStatus", {
            userId: user.id,
            status:
              req.body.status === "invisible" ? "offline" : req.body.status
          })
        })
        io.to(user.id).emit("userStatus", {
          userId: user.id,
          status: req.body.status === "invisible" ? "offline" : req.body.status
        })
        io.to(user.id).emit("userSettings", {
          userId: user.id,
          status: req.body.status === "invisible" ? "offline" : req.body.status,
          storedStatus: req.body.status
        })
        res.json({
          status: req.body.status === "invisible" ? "offline" : req.body.status,
          storedStatus: req.body.status
        })
      }
    } else {
      throw Errors.invalidParameter("Settings type", "Invalid settings type")
    }
  } catch (e) {
    console.log(e)
    next(e)
  }
})

module.exports = router
