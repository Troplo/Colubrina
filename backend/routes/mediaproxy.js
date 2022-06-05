const express = require("express")
const router = express.Router()
const Errors = require("../lib/errors.js")
const { Message } = require("../models")
const axios = require("axios")

router.get("/:mid/:index/:securityToken", async (req, res, next) => {
  try {
    const message = await Message.findOne({
      where: {
        id: req.params.mid
      }
    })
    if (!message) {
      throw Errors.invalidParameter("message id")
    }
    const embed = message.embeds.find(
      (e) => e.securityToken === req.params.securityToken
    )
    if (!embed) {
      throw Errors.invalidParameter("securityToken")
    }
    await axios
      .get(embed.link, {
        headers: {
          "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)"
        },
        responseType: "arraybuffer"
      })
      .then((response) => {
        res.setHeader("content-type", response.headers["content-type"])
        res.setHeader("cache-control", "public, max-age=604800")
        res.end(response.data, "binary")
      })
  } catch (e) {
    next(e)
  }
})

router.get("/:mid/:index/:securityToken.:extension", async (req, res, next) => {
  try {
    const message = await Message.findOne({
      where: {
        id: req.params.mid
      }
    })
    if (!message) {
      throw Errors.invalidParameter("message id")
    }
    const embed = message.embeds.find(
      (e) => e.securityToken === req.params.securityToken
    )
    if (!embed) {
      throw Errors.invalidParameter("securityToken")
    }
    await axios
      .get(embed.link, {
        headers: {
          "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)"
        },
        responseType: "arraybuffer"
      })
      .then((response) => {
        res.setHeader("content-type", response.headers["content-type"])
        res.setHeader("cache-control", "public, max-age=604800")
        res.end(response.data, "binary")
      })
  } catch (e) {
    next(e)
  }
})

module.exports = router
