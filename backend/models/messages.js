"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      Message.belongsTo(models.User, {
        as: "user"
      })
      Message.belongsTo(models.Chat, {
        as: "chat"
      })
      Message.belongsTo(models.Message, {
        as: "reply"
      })
      Message.hasMany(models.Attachment, {
        as: "attachments",
        foreignKey: "messageId"
      })
      Message.hasMany(models.ChatAssociation, {
        as: "readReceipts",
        foreignKey: "lastRead"
      })
    }
  }
  Message.init(
    {
      chatId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM([
          "message",
          "leave",
          "join",
          "pin",
          "administrator",
          "rename",
          "system"
        ])
      },
      embeds: {
        type: DataTypes.JSON,
        defaultValue: [],
        allowNull: false
      },
      edited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      editedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      replyId: {
        type: DataTypes.BIGINT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "Message"
    }
  )
  return Message
}
