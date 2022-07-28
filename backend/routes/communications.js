const express = require("express")
const router = express.Router()
const Errors = require("../lib/errors.js")
const auth = require("../lib/authorize.js")
const {
  User,
  Chat,
  ChatAssociation,
  Message,
  Friend,
  Attachment,
  Nickname
} = require("../models")
const { Op } = require("sequelize")
const rateLimit = require("express-rate-limit")
const multer = require("multer")
const cryptoRandomString = require("crypto-random-string")
const path = require("path")
const fs = require("fs")
const FileType = require("file-type")

const limiter = rateLimit({
  windowMs: 10 * 1000,
  max: 8,
  message: Errors.rateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => req.user.id || req.ip
})

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

const upload = multer({
  storage: storage,
  limits: { fileSize: 12 * 1024 * 1024 }
})

const resolveEmbeds = require("../lib/resolveEmbeds.js")
const paginate = require("jw-paginate")

router.get("/", auth, async (req, res, next) => {
  try {
    let chats = await ChatAssociation.findAll({
      where: {
        userId: req.user.id
      },
      include: [
        {
          model: Chat,
          as: "chat",
          attributes: [
            "id",
            "name",
            "updatedAt",
            "createdAt",
            "userId",
            "type"
          ],
          include: [
            {
              model: User,
              as: "users",
              attributes: ["username", "avatar", "id", "status", "bot"],
              include: [
                {
                  model: Nickname,
                  as: "nickname",
                  required: false,
                  attributes: ["nickname"],
                  where: {
                    userId: req.user.id
                  }
                }
              ]
            },
            {
              model: ChatAssociation,
              as: "associations",
              order: [["lastRead", "DESC"]],
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: [
                    "username",
                    "avatar",
                    "id",
                    "createdAt",
                    "updatedAt",

                    "status",

                    "admin",
                    "status",
                    "bot"
                  ],
                  include: [
                    {
                      model: Nickname,
                      as: "nickname",
                      attributes: ["nickname"],
                      required: false,
                      where: {
                        userId: req.user.id
                      }
                    }
                  ]
                }
              ]
            },
            {
              model: Message,
              as: "lastMessages",
              limit: 30,
              order: [["id", "DESC"]],
              attributes: ["id", "createdAt", "updatedAt", "userId"]
            }
          ]
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "createdAt", "updatedAt", "status"],
          include: [
            {
              model: Nickname,
              as: "nickname",
              attributes: ["nickname"],
              required: false,
              where: {
                userId: req.user.id
              }
            }
          ]
        }
      ]
    })
    chats.sort((a, b) => {
      if (a.chat.lastMessages.length > 0 && b.chat.lastMessages.length > 0) {
        return b.chat.lastMessages[0].id - a.chat.lastMessages[0].id
      } else if (a.chat.lastMessages.length > 0) {
        return -1
      } else if (b.chat.lastMessages.length > 0) {
        return 1
      } else {
        return b.chat.id - a.chat.id
      }
    })
    res.json(
      chats.map((chat) => {
        return {
          ...chat.dataValues,
          unread: chat.chat.lastMessages.filter(
            (message) => message.id > chat.lastRead
          ).length,
          chat: {
            ...chat.chat.dataValues,
            lastMessages: null
          }
        }
      })
    )
  } catch (err) {
    next(err)
  }
})

router.get("/mutual/:id/friends", auth, async (req, res, next) => {
  try {
    const userFriends = await Friend.findAll({
      where: {
        userId: req.params.id
      }
    })
    const friends = await Friend.findAll({
      where: {
        friendId: userFriends.map((friend) => friend.friendId),
        userId: req.user.id
      },
      include: [
        {
          model: User,
          as: "user2",
          attributes: [
            "id",
            "username",
            "avatar",

            "createdAt",
            "updatedAt",

            "admin",

            "status"
          ],
          include: [
            {
              model: Nickname,
              as: "nickname",
              attributes: ["nickname"],
              required: false,
              where: {
                userId: req.user.id
              }
            }
          ]
        }
      ]
    })
    res.json(friends.map((friend) => friend.user2))
  } catch (err) {
    next(err)
  }
})

router.get("/mutual/:id/groups", auth, async (req, res, next) => {
  try {
    const userGroups = await ChatAssociation.findAll({
      where: {
        userId: req.params.id
      }
    })
    // find all groups that the req.params.id is a member of and that the req.user.id is a member of
    const groups = await ChatAssociation.findAll({
      where: {
        userId: req.user.id,
        chatId: userGroups.map((group) => group.chatId)
      },
      include: [
        {
          model: Chat,
          as: "chat",
          where: {
            type: "group"
          }
        }
      ]
    })
    res.json(
      groups.map((group) => {
        return {
          ...group.dataValues.chat.dataValues,
          associationId: group.id
        }
      })
    )
  } catch (err) {
    next(err)
  }
})

router.delete(
  "/association/:id/:associationId",
  auth,
  async (req, res, next) => {
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
      await association.destroy()
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
  }
)
router.put("/association/:id/:associationId", auth, async (req, res, next) => {
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

router.post("/association/:id", auth, async (req, res, next) => {
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

router.get("/friends", auth, async (req, res, next) => {
  try {
    let friends = await Friend.findAll({
      where: {
        userId: req.user.id
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "avatar", "createdAt", "updatedAt"]
        },
        {
          model: User,
          as: "user2",
          attributes: ["id", "username", "avatar", "createdAt", "updatedAt"]
        }
      ]
    })
    res.json(friends)
  } catch (err) {
    next(err)
  }
})

router.get("/users", auth, async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: [
        "id",
        "username",
        "name",

        "avatar",
        "createdAt",
        "updatedAt",

        "status",
        "admin"
      ]
    })
    res.json(users)
  } catch (err) {
    next(err)
  }
})

router.post("/friends", auth, async (req, res, next) => {
  try {
    const io = req.app.get("io")
    let friendRes
    try {
      friendRes = req.body.friend.split(":")
    } catch {
      friendRes = req.body.friend
    }
    const user = await User.findOne({
      where: {
        username: friendRes[0] || friendRes
      }
    })
    if (user) {
      const friend = await Friend.findOne({
        where: {
          userId: req.user.id,
          friendId: user.id
        }
      })
      if (friend) {
        throw Errors.friendAlreadyFriends
      } else {
        if (!user.privacy.communications.enabled) {
          throw Errors.communicationsUserNotOptedIn
        } else {
          const newFriend = await Friend.create({
            userId: req.user.id,
            friendId: user.id
          })
          const remoteFriend = await Friend.create({
            userId: user.id,
            friendId: req.user.id,
            status: "pendingCanAccept"
          })
          io.to(user.id).emit("friendRequest", {
            ...remoteFriend.dataValues,
            user: {
              username: req.user.username,
              discussionsImage: req.user.discussionsImage,
              avatar: req.user.avatar,
              id: req.user.id
            }
          })
          res.json(newFriend)
        }
      }
    } else {
      throw Errors.communicationsUserNotFound
    }
  } catch (err) {
    next(err)
  }
})

router.delete("/friends/:id", auth, async (req, res, next) => {
  try {
    const friend = await Friend.findOne({
      where: {
        userId: req.user.id,
        id: req.params.id
      }
    })
    if (friend) {
      await friend.destroy()
      await Friend.destroy({
        where: {
          userId: friend.friendId,
          friendId: req.user.id
        }
      })
      res.sendStatus(204)
    } else {
      throw Errors.friendNotFound
    }
  } catch (err) {
    next(err)
  }
})

router.put("/friends/:id", auth, async (req, res, next) => {
  try {
    const io = req.app.get("io")
    const friend = await Friend.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
        status: "pendingCanAccept"
      }
    })
    if (friend) {
      await friend.update({
        status: "accepted"
      })
      const remoteFriend = await Friend.findOne({
        where: {
          userId: friend.friendId,
          friendId: friend.userId
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "username", "createdAt", "updatedAt"]
          },
          {
            model: User,
            as: "user2",
            attributes: ["id", "username", "createdAt", "updatedAt"]
          }
        ]
      })
      await remoteFriend.update({
        status: "accepted"
      })
      io.to(req.user.id).emit("friendAccepted", {
        ...friend.dataValues
      })
      io.to(remoteFriend.userId).emit("friendAccepted", {
        ...remoteFriend.dataValues
      })
      res.json(friend)
    } else {
      throw Errors.friendNotFound
    }
  } catch (err) {
    next(err)
  }
})

router.get("/search", auth, async (req, res, next) => {
  try {
    const friends = await Friend.findAll({
      where: {
        userId: req.user.id,
        status: "accepted"
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "createdAt", "updatedAt"]
        },
        {
          model: User,
          as: "user2",
          attributes: ["id", "username", "createdAt", "updatedAt"]
        }
      ]
    })
    const users = await User.findAll({
      where: {
        id: friends.map((friend) => friend.friendId),
        username: {
          [Op.like]: `%${req.query.query}%`
        }
      },
      attributes: ["username", "name", "avatar", "id", "createdAt", "updatedAt"]
    })
    users.forEach((user) => {
      if (user.id === req.user.id) {
        users.splice(users.indexOf(user), 1)
      }
    })
    res.json(users)
  } catch (err) {
    next(err)
  }
})

router.get("/:id", auth, async (req, res, next) => {
  try {
    let chat = await ChatAssociation.findOne({
      where: {
        userId: req.user.id,
        id: req.params.id
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
                "updatedAt"
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
    if (chat) {
      res.json(chat)
    } else {
      throw Errors.invalidParameter("chat association id")
    }
  } catch (err) {
    next(err)
  }
})

router.put("/:id/read", auth, async (req, res, next) => {
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
          as: "chat",
          include: [
            {
              model: Message,
              as: "lastMessages",
              limit: 50,
              order: [["id", "DESC"]],
              attributes: ["id", "content", "createdAt", "updatedAt"]
            }
          ]
        }
      ]
    })
    if (chat) {
      await chat.update({
        lastRead: chat.chat.lastMessages[0]?.id || null
      })
      io.to(req.user.id).emit("readChat", {
        id: chat.id,
        lastRead: chat.chat.lastMessages[0]?.id || null
      })
      res.sendStatus(204)
    } else {
      throw Errors.invalidParameter("chat association id")
    }
  } catch (err) {
    next(err)
  }
})

router.put("/:id", auth, async (req, res, next) => {
  try {
    const io = req.app.get("io")
    const association = await ChatAssociation.findOne({
      where: {
        userId: req.user.id,
        id: req.params.id,
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
              attributes: ["id"]
            }
          ]
        }
      ]
    })
    if (association) {
      const chat = await Chat.findOne({
        where: {
          id: association.chatId
        }
      })
      await chat.update({
        name: req.body.name
      })
      association.chat.users.forEach((user) => {
        io.to(user.id).emit("chatUpdated", {
          ...chat.dataValues,
          name: req.body.name
        })
      })
      res.sendStatus(204)
    } else {
      throw Errors.chatNotFoundOrNotAdmin
    }
  } catch (err) {
    next(err)
  }
})

router.put("/:id/message/edit", auth, async (req, res, next) => {
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
          as: "chat",
          include: [
            {
              model: User,
              as: "users",
              attributes: ["id"],
              include: [
                {
                  model: Nickname,
                  as: "nickname",
                  required: false,
                  attributes: ["nickname"],
                  where: {
                    userId: req.user.id
                  }
                }
              ]
            },
            {
              model: Message,
              as: "lastMessages",
              limit: 50,
              order: [["id", "DESC"]],
              attributes: ["id", "content", "createdAt", "updatedAt"]
            }
          ]
        }
      ]
    })
    if (chat) {
      const message = await Message.findOne({
        where: {
          id: req.body.id,
          chatId: chat.chat.id,
          userId: req.user.id
        }
      })
      if (message) {
        await message.update({
          content: req.body.content,
          edited: true,
          editedAt: new Date().toISOString()
        })
        chat.chat.users.forEach((user) => {
          io.to(user.id).emit("editMessage", {
            chatId: chat.chat.id,
            id: message.id,
            edited: true,
            editedAt: new Date().toISOString(),
            content: req.body.content
          })
        })
        res.sendStatus(204)
        const associationsWithUser = await ChatAssociation.findAll({
          where: {
            chatId: chat.chat.id
          }
        })
        await resolveEmbeds(req, message, associationsWithUser)
          .then((embeds) => {
            associationsWithUser.forEach((association) => {
              io.to(association.userId).emit("messageEmbedResolved", {
                chatId: chat.chat.id,
                id: message.id,
                embeds: embeds,
                associationId: association.id,
                keyId: `${message.id}-${message.updatedAt.toISOString()}-embed`
              })
            })
          })
          .catch(() => {})
      } else {
        throw Errors.invalidParameter("message id")
      }
    } else {
      throw Errors.invalidParameter("chat association id")
    }
  } catch (err) {
    next(err)
  }
})

router.get("/:id/search", auth, async (req, res, next) => {
  try {
    const chat = await ChatAssociation.findOne({
      where: {
        userId: req.user.id,
        id: req.params.id
      }
    })
    if (chat) {
      const messages = await Message.findAll({
        where: {
          chatId: chat.chatId,
          content: {
            [Op.like]: `%${req.query.query}%`
          }
        },
        order: [["id", "DESC"]],
        include: [
          {
            model: Attachment,
            as: "attachments"
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
              },
              {
                model: Attachment,
                as: "attachments"
              }
            ]
          }
        ]
      })
      const page = parseInt(req.params.page) || 1
      const pager = paginate(messages.length, page, 15)
      const result = messages.slice(pager.startIndex, pager.endIndex + 1)
      res.json({
        messages: result.map((message) => {
          return {
            ...message.dataValues,
            keyId: `${message.id}-${message.updatedAt.toISOString()}`
          }
        }),
        pager: pager
      })
    }
  } catch (err) {
    next(err)
  }
})

router.delete("/association/:id", auth, async (req, res, next) => {
  try {
    const io = req.app.get("io")
    const chat = await ChatAssociation.findOne({
      where: {
        userId: req.user.id,
        id: req.params.id
      }
    })
    if (chat) {
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

router.delete("/:id/message/:mId", auth, async (req, res, next) => {
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
          as: "chat",
          include: [
            {
              model: User,
              as: "users",
              attributes: ["id"]
            }
          ]
        }
      ]
    })
    if (chat) {
      const message = await Message.findOne({
        where: {
          id: req.params.mId,
          chatId: chat.chat.id,
          userId: req.user.id
        }
      })
      if (message) {
        await message.destroy()
        chat.chat.users.forEach((user) => {
          io.to(user.id).emit("deleteMessage", {
            chatId: chat.chat.id,
            id: message.id
          })
        })
        res.sendStatus(204)
      } else {
        throw Errors.invalidParameter("message id")
      }
    } else {
      throw Errors.invalidParameter("chat association id")
    }
  } catch (err) {
    next(err)
  }
})

router.post(
  "/:id/formData/message",
  auth,
  limiter,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const io = req.app.get("io")
      if (req.body.message.length > 999) {
        throw Errors.invalidParameter("message", "Maximum length is 1000")
      }
      const chat = await ChatAssociation.findOne({
        where: {
          userId: req.user.id,
          id: req.params.id
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
      if (chat) {
        let reply = {
          id: null
        }
        if (req.body.replyId) {
          reply = await Message.findOne({
            where: {
              id: req.body.replyId,
              chatId: chat.chat.id
            }
          })
          if (!reply) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.log("Multer deletion error")
                console.log(err)
              }
            })
            throw Errors.invalidParameter("reply id")
          }
        }
        const meta = await FileType.fromFile(req.file.path)
        const message = await Message.create({
          content: req.body.message,
          userId: req.user.id,
          chatId: chat.chat.id,
          attachments: [],
          embeds: [],
          replyId: reply.id
        })
        await Attachment.create({
          userId: req.user.id,
          type: "message",
          attachment: req.file.filename,
          name: req.file.originalname,
          extension: meta?.ext || req.file.path.split(".").pop() || "other",
          size: req.file.size,
          messageId: message.id
        })
        const messageLookup = await Message.findOne({
          where: {
            id: message.id
          },
          include: [
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
                  ],
                  include: [
                    {
                      model: Nickname,
                      as: "nickname",
                      required: false,
                      attributes: ["nickname"],
                      where: {
                        userId: req.user.id
                      }
                    }
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
              ],
              include: [
                {
                  model: Nickname,
                  as: "nickname",
                  required: false,
                  attributes: ["nickname"],
                  where: {
                    userId: req.user.id
                  }
                }
              ]
            }
          ]
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
              ],
              include: [
                {
                  model: Nickname,
                  as: "nickname",
                  required: false,
                  attributes: ["nickname"],
                  where: {
                    userId: req.user.id
                  }
                }
              ]
            }
          ]
        })
        for (const association of associations) {
          io.to(association.userId).emit("message", {
            ...messageLookup.dataValues,
            user: {
              ...messageLookup.user.dataValues,
              nickname: await Nickname.findOne({
                where: {
                  userId: association.userId,
                  friendId: messageLookup.dataValues.user.dataValues.id
                },
                attributes: ["nickname"]
              })
            },
            associationId: association.id,
            keyId: `${message.id}-${message.updatedAt.toISOString()}`
          })
        }
        res.json({
          ...messageLookup.dataValues,
          keyId: `${message.id}-${message.updatedAt.toISOString()}`
        })
        const associationsWithUser = await ChatAssociation.findAll({
          where: {
            chatId: chat.chat.id
          }
        })
        await resolveEmbeds(req, messageLookup, associations)
          .then((embeds) => {
            associationsWithUser.forEach((association) => {
              io.to(association.userId).emit("messageEmbedResolved", {
                ...message.dataValues,
                embeds: embeds,
                associationId: association.id,
                keyId: `${message.id}-${message.updatedAt.toISOString()}-embed`
              })
            })
          })
          .catch(() => {})
      } else {
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.log("Multer deletion error")
            console.log(err)
          }
        })
        throw Errors.invalidParameter("chat association id")
      }
    } catch (err) {
      next(err)
    }
  }
)

router.post("/:id/message", auth, limiter, async (req, res, next) => {
  try {
    const io = req.app.get("io")
    if (!req.body.message) {
      throw Errors.invalidParameter("message")
    }
    if (!req.body.message.length) {
      throw Errors.invalidParameter("message")
    }
    if (req.body.message.length > 999) {
      throw Errors.invalidParameter("message", "Maximum length is 1000")
    }
    const chat = await ChatAssociation.findOne({
      where: {
        userId: req.user.id,
        id: req.params.id
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

                "bot"
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
            "updatedAt",

            "bot"
          ]
        }
      ]
    })
    if (chat) {
      let reply = {
        id: null
      }
      if (req.body.replyId) {
        reply = await Message.findOne({
          where: {
            id: req.body.replyId,
            chatId: chat.chat.id
          }
        })
        if (!reply) {
          throw Errors.invalidParameter("reply id")
        }
      }
      let embeds
      if (req.user.bot) {
        embeds = req.body.embeds
      } else {
        embeds = []
      }
      const message = await Message.create({
        content: req.body.message,
        userId: req.user.id,
        chatId: chat.chat.id,
        attachments: [],
        embeds,
        replyId: reply.id
      })
      const messageLookup = await Message.findOne({
        where: {
          id: message.id
        },
        include: [
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
                  "updatedAt",

                  "bot"
                ],
                include: [
                  {
                    model: Nickname,
                    as: "nickname",
                    required: false,
                    attributes: ["nickname"],
                    where: {
                      userId: req.user.id
                    }
                  }
                ]
              },
              {
                model: Attachment,
                as: "attachments"
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
                  "updatedAt",

                  "bot"
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
              "updatedAt",

              "bot"
            ],
            include: [
              {
                model: Nickname,
                as: "nickname",
                required: false,
                attributes: ["nickname"],
                where: {
                  userId: req.user.id
                }
              }
            ]
          }
        ]
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
              "updatedAt",

              "bot"
            ]
          }
        ]
      })
      const associationsWithUser = await ChatAssociation.findAll({
        where: {
          chatId: chat.chat.id
        }
      })
      for (const association of associations) {
        io.to(association.userId).emit("message", {
          ...messageLookup.dataValues,
          user: {
            ...messageLookup.user.dataValues,
            nickname: await Nickname.findOne({
              where: {
                userId: association.userId,
                friendId: messageLookup.dataValues.user.dataValues.id
              },
              attributes: ["nickname"]
            })
          },
          associationId: association.id,
          keyId: `${message.id}-${message.updatedAt.toISOString()}`
        })
      }
      res.json({
        ...messageLookup.dataValues,
        keyId: `${message.id}-${message.updatedAt.toISOString()}`
      })
      await resolveEmbeds(req, messageLookup, associations)
        .then((embeds) => {
          associationsWithUser.forEach((association) => {
            io.to(association.userId).emit("messageEmbedResolved", {
              ...message.dataValues,
              embeds: embeds,
              associationId: association.id,
              keyId: `${message.id}-${message.updatedAt.toISOString()}-embed`
            })
          })
        })
        .catch(() => {})
    } else {
      throw Errors.invalidParameter("chat association id")
    }
  } catch (err) {
    next(err)
  }
})

router.post("/nickname/:id", auth, async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.params.id
      }
    })
    if (!user) {
      throw Errors.invalidParameter("user id")
    }
    if (!req.body.nickname?.length) {
      await Nickname.destroy({
        where: {
          userId: req.user.id,
          friendId: req.params.id
        }
      })
      res.json({
        nickname: user.username,
        userId: user.id
      })
      return
    }
    if (req.body.nickname.length > 20) {
      throw Errors.invalidParameter("nickname", "Maximum length is 20")
    }
    const nickname = await Nickname.findOne({
      where: {
        userId: req.user.id,
        friendId: req.params.id
      }
    })
    if (nickname) {
      await nickname.update({
        nickname: req.body.nickname
      })
      res.json({
        nickname: req.body.nickname
      })
    } else {
      const nickname = await Nickname.create({
        userId: req.user.id,
        friendId: req.params.id,
        nickname: req.body.nickname
      })
      res.json(nickname)
    }
  } catch (err) {
    next(err)
  }
})

router.get("/:id/messages", auth, async (req, res, next) => {
  try {
    const chat = await ChatAssociation.findOne({
      where: {
        userId: req.user.id,
        id: req.params.id
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

                "admin",
                "bot"
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
    if (chat) {
      const messages = await Message.findAll({
        where: {
          chatId: chat.chat.id
        },
        include: [
          {
            model: Attachment,
            as: "attachments"
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
              "updatedAt",

              "bot"
            ],
            include: [
              {
                model: Nickname,
                as: "nickname",
                attributes: ["nickname"],
                required: false,
                where: {
                  userId: req.user.id
                }
              }
            ]
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
                  "updatedAt",

                  "bot"
                ]
              },
              {
                model: Attachment,
                as: "attachments"
              }
            ]
          }
        ],
        offset: req.query.offset || 0,
        order: [["id", "DESC"]],
        limit: 50
      })
      const messagesWithKeyId = messages.map((message) => {
        return {
          ...message.dataValues,
          keyId: `${message.id}-${message.updatedAt.toISOString()}`
        }
      })
      res.json(messagesWithKeyId.sort((a, b) => a.id - b.id))
    } else {
      throw Errors.invalidParameter("chat association id")
    }
  } catch (err) {
    next(err)
  }
})

router.put("/:id/typing", auth, async (req, res, next) => {
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
          attributes: ["id", "username", "createdAt", "updatedAt"]
        }
      ]
    })
    if (chat) {
      const userIds = chat.chat.users.map((user) => user.id)
      const userIdsWithoutCurrentUser = userIds.filter(
        (userId) => userId !== req.user.id
      )
      userIdsWithoutCurrentUser.forEach((userId) => {
        const date = new Date()
        io.to(userId).emit("typing", {
          chatId: chat.chat.id,
          userId: req.user.id,
          timeout: new Date(date.getTime() + 5000).toISOString(),
          date: new Date(date).toISOString(),
          username: req.user.username
        })
      })
      res.sendStatus(204)
    } else {
      throw Errors.invalidParameter("chat association id")
    }
  } catch (err) {
    next(err)
  }
})

router.post("/create", auth, async (req, res, next) => {
  try {
    const io = req.app.get("io")
    let name
    let type
    if (req.body.users.length <= 1) {
      name = "Direct Message"
      type = "direct"
    } else {
      name = "Unnamed Group"
      type = "group"
    }
    if (req.body.users.length > 10) {
      throw Errors.invalidParameter("User", "The maximum number of users is 10")
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
    if (type === "direct") {
      const chats = await Chat.findAll({
        where: {
          userId: req.user.id,
          type: "direct"
        },
        include: [
          {
            model: ChatAssociation,
            as: "associations"
          }
        ]
      })
      const chat = chats.find((chat) => {
        return chat.associations.find((association) => {
          return association.userId === req.body.users[0]
        })
      })
      if (chat) {
        res.json({
          ...chat.associations.find((association) => {
            return association.userId === req.user.id
          }).dataValues,
          existing: true
        })
        return
      }
    }
    if (friends.length !== req.body.users.length) {
      throw Errors.invalidParameter(
        "User",
        "You are not friends with this user"
      )
    }
    const chat = await Chat.create({
      name,
      userId: req.user.id,
      type
    })
    req.body.users.push(req.user.id)
    for (let i = 0; i < req.body.users.length; i++) {
      let rank
      if (type === "group") {
        if (req.body.users[i] === req.user.id) {
          rank = "admin"
        } else {
          rank = "member"
        }
      } else {
        rank = "member"
      }
      const c1 = await ChatAssociation.create({
        chatId: chat.id,
        userId: req.body.users[i],
        rank
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
                model: ChatAssociation,
                as: "associations",
                order: [["lastRead", "DESC"]],
                include: [
                  {
                    model: User,
                    as: "user",
                    attributes: [
                      "username",
                      "avatar",
                      "id",
                      "createdAt",
                      "updatedAt",

                      "status",

                      "admin"
                    ],
                    include: [
                      {
                        model: Nickname,
                        as: "nickname",
                        attributes: ["nickname"],
                        required: false,
                        where: {
                          userId: req.user.id
                        }
                      }
                    ]
                  }
                ]
              },
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
    }
    const association = await ChatAssociation.findOne({
      where: {
        userId: req.user.id,
        chatId: chat.id
      },
      include: [
        {
          model: Chat,
          as: "chat",
          include: [
            {
              model: ChatAssociation,
              as: "associations",
              order: [["lastRead", "DESC"]],
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: [
                    "username",
                    "avatar",
                    "id",
                    "createdAt",
                    "updatedAt",

                    "status",

                    "admin"
                  ],
                  include: [
                    {
                      model: Nickname,
                      as: "nickname",
                      attributes: ["nickname"],
                      required: false,
                      where: {
                        userId: req.user.id
                      }
                    }
                  ]
                }
              ]
            },
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
    res.json(association)
  } catch (err) {
    next(err)
  }
})

module.exports = router
