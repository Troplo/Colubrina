"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.belongsTo(models.Theme, {
        as: "themeObject",
        foreignKey: "themeId"
      })
      User.hasMany(models.Friend, {
        as: "friends",
        foreignKey: "userId"
      })
      User.hasOne(models.Nickname, {
        foreignKey: "friendId",
        as: "nickname"
      })
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notNull: {
            msg: "Username is required"
          },
          notEmpty: {
            msg: "Username is required"
          },
          len: {
            args: [2, 24],
            msg: "Username must be between 2 and 24 characters"
          },
          regex: {
            args: /^[a-z0-9_-]+$/i,
            msg: "Username must be alphanumeric"
          }
        }
      },
      theme: {
        type: DataTypes.STRING,
        defaultValue: "dark"
      },
      themeId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 1
      },
      accentColor: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      },
      privacy: {
        type: DataTypes.JSON,
        defaultValue: {
          communications: {
            enabled: true,
            outsideTenant: false,
            directMessages: "friendsOnly",
            friendRequests: true
          }
        }
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: ""
      },
      admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      totp: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      totpEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      font: {
        type: DataTypes.STRING,
        defaultValue: "Inter",
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM([
          "online",
          "busy",
          "away",
          "offline",
          "invisible"
        ]),
        allowNull: false,
        defaultValue: "offline"
      },
      storedStatus: {
        type: DataTypes.ENUM(["online", "busy", "away", "invisible"]),
        allowNull: false,
        defaultValue: "online"
      },
      experiments: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true
      },
      bot: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      lastSeenAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      banned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      emailToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      passwordResetExpiry: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "User"
    }
  )
  return User
}
