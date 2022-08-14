"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class Poll extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      Poll.belongsTo(models.Message, {
        as: "message"
      })
      Poll.hasMany(models.PollAnswer, {
        as: "answers",
        foreignKey: "pollId"
      })
    }
  }
  Poll.init(
    {
      messageId: {
        type: DataTypes.BIGINT
      },
      userId: {
        type: DataTypes.BIGINT
      },
      title: {
        type: DataTypes.STRING
      },
      description: {
        type: DataTypes.TEXT
      },
      options: {
        type: DataTypes.JSON,
        defaultValue: []
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
      modelName: "Poll"
    }
  )
  return Poll
}
