"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Attachments", "messageId", {
      type: Sequelize.BIGINT
    })
    await queryInterface.removeColumn("Messages", "attachments")
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
