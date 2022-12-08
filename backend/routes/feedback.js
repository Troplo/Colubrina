const express = require("express")
const router = express.Router()
const Errors = require("../lib/errors.js")
const auth = require("../lib/authorize.js")
const { Feedback } = require("../models")

router.post("/", auth, async (req, res, next) => {
  try {
    await Feedback.create({
      feedbackText: req.body.text,
      starRating: req.body.starRating,
      debug: {
        client: req.body.debug
      },
      route: req.body.route,
      userId: req.user.id,
      tenant: "Colourbrina"
    })
    res.sendStatus(204)
  } catch (e) {
    next(e)
  }
})

module.exports = router
