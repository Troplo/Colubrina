"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class PollAnswer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      PollAnswer.belongsTo(models.Poll, {
        as: "poll"
      })
      PollAnswer.belongsTo(models.User, {
        as: "user"
      })
    }
  }
  PollAnswer.init(
    {
      pollId: {
        type: DataTypes.BIGINT
      },
      userId: {
        type: DataTypes.BIGINT
      },
      answer: {
        type: DataTypes.STRING
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
      modelName: "PollAnswer"
    }
  )
  return PollAnswer
}
