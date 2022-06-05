"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Attachments", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      attachment: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM(["message", "avatar"]),
        allowNull: false,
        defaultValue: "message"
      },
      size: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      extension: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      chatId: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Attachments")
  }
}
