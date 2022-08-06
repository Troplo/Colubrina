const express = require("express")
const router = express.Router()
const Errors = require("../lib/errors.js")
const auth = require("../lib/authorize.js")
const {
  User,
  Chat,
  ChatAssociation,
  Pin,
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

async function createMessage(req, type, content, association, userId) {
  const io = req.app.get("io")
  const message = await Message.create({
    userId: 0,
    chatId: association.chatId,
    content: content,
    type: type || "system"
  })
  const associations = await ChatAssociation.findAll({
    where: {
      chatId: association.chatId
    }
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
  associations.forEach((user) => {
    io.to(user.dataValues.userId).emit("message", {
      ...messageLookup.dataValues,
      associationId: user.dataValues.id,
      keyId: `${
        message.dataValues.id
      }-${message.dataValues.updatedAt.toISOString()}`,
      notify:
        association.notifications === "all" ||
        (association.notifications === "mentions" &&
          message.content
            .toLowerCase()
            .includes(association.user.username.toLowerCase()))
    })
  })
}

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

router.get("/users", auth, async (req, res, next) => {
  try {
    if (process.env.PUBLIC_USERS === "true") {
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
        ],
        where: {
          banned: false
        }
      })
      res.json(users)
    } else {
      res.json([])
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

router.get("/:id/pins", auth, async (req, res, next) => {
  try {
    let chat = await ChatAssociation.findOne({
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
      const pins = await Pin.findAll({
        where: {
          chatId: chat.chat.id
        },
        include: [
          {
            model: User,
            as: "pinnedBy",
            required: false,
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
            as: "message",
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
                    attributes: ["nickname"],
                    required: false,
                    where: {
                      userId: req.user.id
                    }
                  }
                ]
              }
            ]
          }
        ],
        order: [["id", "DESC"]]
      })
      res.json(
        pins.map((pin) => {
          const message = pin.dataValues.message.dataValues
          return {
            ...pin.dataValues,
            message: {
              ...pin.dataValues.message.dataValues,
              keyId: `${message.id}-${message.updatedAt.toISOString()}`
            }
          }
        })
      )
    } else {
      throw Errors.invalidParameter("chat association id")
    }
  } catch (err) {
    next(err)
  }
})

router.post("/:id/pins", auth, async (req, res, next) => {
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
    if (chat?.chat?.type === "direct" || chat?.rank === "admin") {
      const message = await Message.findOne({
        where: {
          id: req.body.messageId,
          chatId: chat.chat.id
        }
      })
      if (message) {
        const checkPin = await Pin.findOne({
          where: {
            messageId: message.id,
            chatId: chat.chat.id
          }
        })
        if (checkPin) {
          await checkPin.destroy()
          res.json({
            message: "Message unpinned successfully."
          })
          await createMessage(
            req,
            "pin",
            `${req.user.username} unpinned a message from the chat.`,
            chat,
            req.user.id
          )
          return
        }
        const pin = await Pin.create({
          chatId: chat.chat.id,
          messageId: req.body.messageId,
          pinnedById: req.user.id
        })
        await createMessage(
          req,
          "pin",
          `${req.user.username} pinned a message to the chat.`,
          chat,
          req.user.id
        )
        res.json({
          ...pin.dataValues,
          message: "Message pinned successfully."
        })
      }
    } else {
      throw Errors.invalidParameter("chat association id")
    }
  } catch (e) {
    next(e)
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
              model: User,
              as: "users",
              attributes: ["id"]
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
      if (req.user.storedStatus !== "invisible") {
        await chat.update({
          lastRead: chat.chat.lastMessages[0]?.id || null
        })
        io.to(req.user.id).emit("readChat", {
          id: chat.id,
          lastRead: chat.chat.lastMessages[0]?.id || null
        })
        res.sendStatus(204)
        for (const user of chat.chat.users) {
          io.to(user.id).emit("readReceipt", {
            id: chat.id,
            messageId: chat.chat.lastMessages[0]?.id || null,
            userId: req.user.id,
            chatId: chat.chat.id,
            user: {
              username: req.user.username,
              avatar: req.user.avatar,
              id: req.user.id
            },
            previousMessageId: chat.lastRead
          })
        }
      } else {
        io.to(req.user.id).emit("readChat", {
          id: chat.id,
          lastRead: chat.chat.lastMessages[0]?.id || null
        })
        res.sendStatus(204)
      }
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
      await createMessage(
        req,
        "rename",
        `${req.user.username} renamed the chat to ${req.body.name}`,
        association,
        req.user.id
      )
      res.sendStatus(204)
    } else {
      throw Errors.chatNotFoundOrNotAdmin
    }
  } catch (err) {
    next(err)
  }
})

router.put("/settings/:id", auth, async (req, res, next) => {
  try {
    const io = req.app.get("io")
    const association = await ChatAssociation.findOne({
      where: {
        userId: req.user.id,
        id: req.params.id
      }
    })
    if (association) {
      await association.update({
        notifications: req.body.notifications
      })
      res.sendStatus(204)
    } else {
      throw Errors.invalidParameter("chat association id")
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
            keyId: `${message.id}-${message.updatedAt.toISOString()}`,
            notify:
              association.notifications === "all" ||
              (association.notifications === "mentions" &&
                message.content
                  .toLowerCase()
                  .includes(association.user.username.toLowerCase()))
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
          keyId: `${message.id}-${message.updatedAt.toISOString()}`,
          notify:
            association.notifications === "all" ||
            (association.notifications === "mentions" &&
              message.content
                .toLowerCase()
                .includes(association.user.username.toLowerCase()))
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
      let or
      if (parseInt(req.query.offset)) {
        or = {
          [Op.or]: [
            {
              id: {
                [Op.lt]: parseInt(req.query.offset)
                  ? parseInt(req.query.offset)
                  : 0
              }
            }
          ]
        }
      } else {
        or = {}
      }
      const messages = await Message.findAll({
        where: {
          chatId: chat.chat.id,
          ...or
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
      const chats = await ChatAssociation.findAll({
        where: {
          userId: req.user.id
        },
        include: [
          {
            model: Chat,
            as: "chat",
            where: {
              type: "direct"
            },
            include: [
              {
                model: User,
                as: "users"
              }
            ]
          }
        ]
      })
      const chat = chats.find((chat) => {
        const users = chat.chat.users.map((user) => user.id)
        return users.includes(req.body.users[0]) && users.includes(req.user.id)
      })
      if (chat) {
        res.json({
          ...chat.dataValues,
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
    for (const id of req.body.users) {
      let rank
      if (type === "group") {
        if (id === req.user.id) {
          rank = "admin"
        } else {
          rank = "member"
        }
      } else {
        rank = "member"
      }
      await ChatAssociation.create({
        chatId: chat.id,
        userId: id,
        rank
      })
    }
    for (const id of req.body.users) {
      const association = await ChatAssociation.findOne({
        where: {
          chatId: chat.id,
          userId: id
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
      io.to(id).emit("chatAdded", association)
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
