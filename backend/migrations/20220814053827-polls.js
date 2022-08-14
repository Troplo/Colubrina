"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Polls", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      messageId: {
        type: Sequelize.BIGINT
      },
      userId: {
        type: Sequelize.BIGINT
      },
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      options: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
    await queryInterface.addIndex("Polls", ["messageId"])
    await queryInterface.addIndex("Polls", ["userId"])
    await queryInterface.createTable("PollAnswers", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      pollId: {
        type: Sequelize.BIGINT
      },
      userId: {
        type: Sequelize.BIGINT
      },
      answer: {
        type: Sequelize.STRING
      }
    })
    await queryInterface.addIndex("PollAnswers", ["pollId"])
    await queryInterface.addIndex("PollAnswers", ["userId"])
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
}
