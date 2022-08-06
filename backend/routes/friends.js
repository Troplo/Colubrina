const auth = require("../lib/authorize")
const { Friend, User } = require("../models")
const Errors = require("../lib/errors")
const express = require("express")
const router = express.Router()

router.all("*", auth, async (req, res, next) => {
  try {
    if (!req.user.emailVerified && req.app.locals.config.emailVerification) {
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
    const friends = await Friend.findAll({
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

router.post("/", auth, async (req, res, next) => {
  try {
    const io = req.app.get("io")
    const user = await User.findOne({
      where: {
        username: req.body.friend
      }
    })
    if (user) {
      if (user.id === req.user.id) {
        throw Errors.cannotFriendYourself
      }
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
          io.to(user.id).emit("friendUpdate", {})
          io.to(req.user.id).emit("friendUpdate", {})
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

router.delete("/:id", auth, async (req, res, next) => {
  try {
    const io = req.app.get("io")
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
      io.to(friend.friendId).emit("friendUpdate", {})
      io.to(req.user.id).emit("friendUpdate", {})
      res.sendStatus(204)
    } else {
      throw Errors.friendNotFound
    }
  } catch (err) {
    next(err)
  }
})

router.put("/:id", auth, async (req, res, next) => {
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
      io.to(friend.userId).emit("friendUpdate", {})
      io.to(remoteFriend.userId).emit("friendUpdate", {})
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

module.exports = router
