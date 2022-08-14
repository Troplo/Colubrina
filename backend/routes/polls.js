const express = require("express")
const router = express.Router()
const Errors = require("../lib/errors.js")
const {
  User,
  Chat,
  ChatAssociation,
  Poll,
  PollAnswer,
  Message
} = require("../models")
const auth = require("../lib/authorize")
const rateLimit = require("express-rate-limit")

const limiter = rateLimit({
  windowMs: 20 * 1000,
  max: 8,
  message: Errors.rateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => req.user?.id || req.ip
})

router.post("/:id/vote", auth, limiter, async (req, res, next) => {
  try {
    const io = req.app.get("io")
    const poll = await Poll.findOne({
      where: {
        id: req.params.id
      },
      include: [
        {
          model: Message,
          as: "message",
          include: [
            {
              model: Chat,
              as: "chat",
              include: [
                {
                  model: ChatAssociation,
                  as: "association",
                  where: {
                    userId: req.user.id
                  }
                },
                {
                  model: ChatAssociation,
                  as: "associations"
                }
              ]
            }
          ]
        }
      ]
    })
    if (!poll) throw Errors.invalidParameter("poll id")
    let answer = await PollAnswer.findOne({
      where: {
        pollId: poll.id,
        userId: req.user.id
      }
    })
    const validate = poll.options.find(
      (option) => option.id === req.body.option
    )
    if (!validate) throw Errors.invalidParameter("option")
    if (answer) {
      if (answer?.answer === req.body.option) {
        for (const association of poll.message.chat.associations) {
          io.to(association.userId).emit(`pollAnswer-${poll.messageId}`, {
            poll: poll,
            answer: null,
            id: answer.id
          })
        }
        await answer.destroy()
        res.sendStatus(204)
        return
      }
      await answer.update({
        answer: req.body.option
      })
      for (const association of poll.message.chat.associations) {
        io.to(association.userId).emit(`pollAnswer-${poll.messageId}`, {
          poll: poll,
          answer: answer,
          id: answer.id
        })
      }
      res.sendStatus(204)
    } else {
      answer = await PollAnswer.create({
        pollId: poll.id,
        userId: req.user.id,
        answer: req.body.option
      })
      for (const association of poll.message.chat.associations) {
        io.to(association.userId).emit(`pollAnswer-${poll.messageId}`, {
          poll: poll,
          answer: answer,
          id: answer.id
        })
      }
      res.sendStatus(204)
    }
  } catch (e) {
    next(e)
  }
})

module.exports = router
