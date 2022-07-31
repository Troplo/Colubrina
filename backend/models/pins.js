"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class Pin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Pin.belongsTo(models.User, {
        as: "pinnedBy"
      })
      Pin.belongsTo(models.Message, {
        as: "message"
      })
      Pin.belongsTo(models.Chat, {
        as: "chat"
      })
    }
  }
  Pin.init(
    {
      pinnedById: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      messageId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      chatId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: "Pin"
    }
  )
  return Pin
}
