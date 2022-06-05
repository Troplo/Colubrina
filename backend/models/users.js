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
    }
  }
  User.init(
    {
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
            args: [2, 12],
            msg: "Username must be between 2 and 12 characters"
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
      guidedWizard: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
      emailDirectLogin: {
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
        defaultValue: "Roboto",
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
      }
    },
    {
      sequelize,
      modelName: "User"
    }
  )
  return User
}
