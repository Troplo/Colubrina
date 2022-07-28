"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class Nickname extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      Nickname.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user"
      })
      Nickname.belongsTo(models.User, {
        foreignKey: "friendId",
        as: "userNickname"
      })
    }
  }
  Nickname.init(
    {
      userId: {
        allowNull: false,
        type: DataTypes.BIGINT
      },
      nickname: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {
          notEmpty: true,
          len: [1, 20]
        }
      },
      friendId: {
        allowNull: false,
        type: DataTypes.BIGINT
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    },
    {
      sequelize,
      modelName: "Nickname"
    }
  )
  return Nickname
}
