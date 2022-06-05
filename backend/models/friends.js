"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class Friend extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      Friend.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user"
      })
      Friend.belongsTo(models.User, {
        foreignKey: "friendId",
        as: "user2"
      })
    }
  }
  Friend.init(
    {
      userId: DataTypes.BIGINT,
      friendId: DataTypes.BIGINT,
      status: {
        type: DataTypes.ENUM(["pending", "accepted", "declined"]),
        defaultValue: "pending"
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    },
    {
      sequelize,
      modelName: "Friend"
    }
  )
  return Friend
}
