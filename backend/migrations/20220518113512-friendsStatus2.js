"use strict"

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // modify status column
    await queryInterface.changeColumn("friends", "status", {
      type: Sequelize.ENUM([
        "pending",
        "pendingCanAccept",
        "accepted",
        "rejected"
      ])
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
}
