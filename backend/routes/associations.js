const express = require("express")
const router = express.Router()
const Errors = require("../lib/errors.js")
const auth = require("../lib/authorize.js")
const {
  User,
  Message,
  ChatAssociation,
  Chat,
  Attachment,
  Friend
} = require("../models")

router.all("*", auth, async (req, res, next) => {
  try {
    if (!req.user.emailVerified && process.env.EMAIL_VERIFICATION === "true") {
      throw Errors.emailVerificationRequired
    } else {
      next()
    }
  } catch (e) {
    next(e)
  }
})

router.delete("/:id/:associationId", auth, async (req, res, next) => {
  try {
    const io = req.app.get("io")
    const chat = await ChatAssociation.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
        rank: "admin"
      },
      include: [
        {
          model: Chat,
          as: "chat",
          include: [
            {
              model: User,
              as: "users",
              attributes: ["id", "username", "createdAt", "updatedAt"]
            }
          ]
        }
      ]
    })
    const association = await ChatAssociation.findOne({
      where: {
        id: req.params.associationId,
        chatId: chat.chat.id
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "createdAt", "updatedAt"]
        }
      ]
    })
    if (!chat) {
      throw Errors.chatNotFoundOrNotAdmin
    }
    if (!association) {
      throw Errors.chatNotFoundOrNotAdmin
    }
    if (association.chat) await association.destroy()
    res.sendStatus(204)
    const message = await Message.create({
      userId: 0,
      chatId: chat.chat.id,
      content: `${association.user.username} has been removed by ${req.user.username}.`,
      type: "leave"
    })
    const associations = await ChatAssociation.findAll({
      where: {
        chatId: chat.chat.id
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "username",
            "name",
            "avatar",
            "id",
            "createdAt",
            "updatedAt"
          ]
        }
      ]
    })
    const messageLookup = await Message.findOne({
      where: {
        id: message.id
      },
      include: [
        {
          model: ChatAssociation,
          as: "readReceipts",
          attributes: ["id"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["username", "name", "avatar", "id"]
            }
          ]
        },
        {
          model: Attachment,
          as: "attachments"
        },
        {
          model: Message,
          as: "reply",
          include: [
            {
              model: User,
              as: "user",
              attributes: [
                "username",
                "name",
                "avatar",
                "id",
                "createdAt",
                "updatedAt"
              ]
            }
          ]
        },
        {
          model: Chat,
          as: "chat",
          include: [
            {
              model: User,
              as: "users",
              attributes: [
                "username",
                "name",
                "avatar",
                "id",
                "createdAt",
                "updatedAt"
              ]
            }
          ]
        },
        {
          model: User,
          as: "user",
          attributes: [
            "username",
            "name",
            "avatar",
            "id",
            "createdAt",
            "updatedAt"
          ]
        }
      ]
    })
    associations.forEach((association) => {
      io.to(association.userId).emit("message", {
        ...messageLookup.dataValues,
        associationId: association.id,
        keyId: `${message.id}-${message.updatedAt.toISOString()}`
      })
    })
  } catch (err) {
    next(err)
  }
})
router.put("/:id/:associationId", auth, async (req, res, next) => {
  try {
    const chat = await ChatAssociation.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
        rank: "admin"
      },
      include: [
        {
          model: Chat,
          as: "chat",
          include: [
            {
              model: User,
              as: "users",
              attributes: ["id", "username", "createdAt", "updatedAt"]
            }
          ]
        }
      ]
    })
    const association = await ChatAssociation.findOne({
      where: {
        id: req.params.associationId,
        chatId: chat.chat.id
      }
    })
    if (!chat) {
      throw Errors.chatNotFoundOrNotAdmin
    }
    if (!association) {
      throw Errors.chatNotFoundOrNotAdmin
    }
    if (association.rank === "admin") {
      throw Errors.chatNotFoundOrNotAdmin
    }
    await association.update({
      rank: req.body.rank
    })
    res.sendStatus(204)
  } catch (err) {
    next(err)
  }
})

router.post("/:id", auth, async (req, res, next) => {
  try {
    const io = req.app.get("io")
    const chat = await ChatAssociation.findOne({
      where: {
        userId: req.user.id,
        chatId: req.params.id,
        rank: "admin"
      },
      include: [
        {
          model: Chat,
          as: "chat",
          include: [
            {
              model: User,
              as: "users",
              attributes: ["id", "username", "createdAt", "updatedAt"]
            }
          ]
        }
      ]
    })
    if (chat) {
      if (req.body.users.length > 10) {
        throw Errors.invalidParameter(
          "User",
          "The maximum number of users is 10"
        )
      }
      if (!req.body.users.length) {
        throw Errors.invalidParameter(
          "User",
          "You need at least 1 user to create a chat"
        )
      }
      if (req.body.users.includes(req.user.id)) {
        throw Errors.invalidParameter(
          "User",
          "You cannot create a DM with yourself"
        )
      }
      const friends = await Friend.findAll({
        where: {
          userId: req.user.id,
          friendId: req.body.users,
          status: "accepted"
        }
      })
      if (friends.length !== req.body.users.length) {
        throw Errors.invalidParameter(
          "User",
          "You are not friends with this user"
        )
      }
      const users = await ChatAssociation.findAll({
        where: {
          userId: req.body.users,
          chatId: req.params.id
        }
      })
      if (users.length > 0) {
        throw Errors.invalidParameter(
          "User",
          "One or more users are already in this chat"
        )
      }
      const associations = await ChatAssociation.findAll({
        where: {
          chatId: chat.chatId
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: [
              "username",
              "name",
              "avatar",
              "id",
              "createdAt",
              "updatedAt"
            ]
          }
        ]
      })
      for (let i = 0; i < req.body.users.length; i++) {
        const c1 = await ChatAssociation.create({
          chatId: chat.chat.id,
          userId: req.body.users[i],
          rank: "member"
        })
        const association = await ChatAssociation.findOne({
          where: {
            id: c1.id
          },
          include: [
            {
              model: Chat,
              as: "chat",
              include: [
                {
                  model: User,
                  as: "users",
                  attributes: [
                    "username",
                    "name",
                    "avatar",
                    "id",
                    "createdAt",
                    "updatedAt",
                    "status"
                  ]
                }
              ]
            },
            {
              model: User,
              as: "user",
              attributes: ["id", "username", "createdAt", "updatedAt"]
            }
          ]
        })
        io.to(req.body.users[i]).emit("chatAdded", association)
        const message = await Message.create({
          userId: 0,
          chatId: chat.chatId,
          content: `${association.user.username} has been added by ${req.user.username}.`,
          type: "join"
        })
        const messageLookup = await Message.findOne({
          where: {
            id: message.id
          },
          include: [
            {
              model: ChatAssociation,
              as: "readReceipts",
              attributes: ["id"],
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["username", "name", "avatar", "id"]
                }
              ]
            },
            {
              model: Attachment,
              as: "attachments"
            },
            {
              model: Message,
              as: "reply",
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: [
                    "username",
                    "name",
                    "avatar",
                    "id",
                    "createdAt",
                    "updatedAt"
                  ]
                }
              ]
            },
            {
              model: Chat,
              as: "chat",
              include: [
                {
                  model: User,
                  as: "users",
                  attributes: [
                    "username",
                    "name",
                    "avatar",
                    "id",
                    "createdAt",
                    "updatedAt"
                  ]
                }
              ]
            },
            {
              model: User,
              as: "user",
              attributes: [
                "username",
                "name",
                "avatar",
                "id",
                "createdAt",
                "updatedAt"
              ]
            }
          ]
        })
        associations.forEach((association) => {
          io.to(association.userId).emit("message", {
            ...messageLookup.dataValues,
            associationId: association.id,
            keyId: `${message.id}-${message.updatedAt.toISOString()}`
          })
        })
      }
      res.sendStatus(204)
    } else {
      throw Errors.chatNotFoundOrNotAdmin
    }
  } catch (err) {
    next(err)
  }
})

router.delete("/:id", auth, async (req, res, next) => {
  try {
    const io = req.app.get("io")
    const chat = await ChatAssociation.findOne({
      where: {
        userId: req.user.id,
        id: req.params.id
      },
      include: [
        {
          model: Chat,
          as: "chat"
        }
      ]
    })
    if (chat) {
      if (chat.chat.type === "direct") {
        throw Errors.leavingDirectChat
      }
      await chat.destroy()
      res.sendStatus(204)
      const message = await Message.create({
        userId: 0,
        chatId: chat.chatId,
        content: `${req.user.username} has left the group.`,
        type: "leave"
      })
      const associations = await ChatAssociation.findAll({
        where: {
          chatId: chat.chatId
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: [
              "username",
              "name",
              "avatar",
              "id",
              "createdAt",
              "updatedAt"
            ]
          }
        ]
      })
      const messageLookup = await Message.findOne({
        where: {
          id: message.id
        },
        include: [
          {
            model: ChatAssociation,
            as: "readReceipts",
            attributes: ["id"],
            include: [
              {
                model: User,
                as: "user",
                attributes: ["username", "name", "avatar", "id"]
              }
            ]
          },
          {
            model: Attachment,
            as: "attachments"
          },
          {
            model: Message,
            as: "reply",
            include: [
              {
                model: User,
                as: "user",
                attributes: [
                  "username",
                  "name",
                  "avatar",
                  "id",
                  "createdAt",
                  "updatedAt"
                ]
              }
            ]
          },
          {
            model: Chat,
            as: "chat",
            include: [
              {
                model: User,
                as: "users",
                attributes: [
                  "username",
                  "name",
                  "avatar",
                  "id",
                  "createdAt",
                  "updatedAt"
                ]
              }
            ]
          },
          {
            model: User,
            as: "user",
            attributes: [
              "username",
              "name",
              "avatar",
              "id",
              "createdAt",
              "updatedAt"
            ]
          }
        ]
      })
      associations.forEach((association) => {
        io.to(association.userId).emit("message", {
          ...messageLookup.dataValues,
          associationId: association.id,
          keyId: `${message.id}-${message.updatedAt.toISOString()}`
        })
      })
    } else {
      throw Errors.invalidParameter("chat association id")
    }
  } catch (err) {
    next(err)
  }
})

module.exports = router
