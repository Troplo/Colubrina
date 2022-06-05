"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class Attachment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      Attachment.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user"
      })
      Attachment.belongsTo(models.Chat, {
        foreignKey: "chatId",
        as: "chat"
      })
    }
  }
  Attachment.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      attachment: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(["message", "avatar"]),
        allowNull: false,
        defaultValue: "message"
      },
      size: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      extension: {
        type: DataTypes.STRING,
        allowNull: true
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      chatId: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      messageId: {
        type: DataTypes.BIGINT,
        allowNull: true
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
      modelName: "Attachment"
    }
  )
  return Attachment
}
