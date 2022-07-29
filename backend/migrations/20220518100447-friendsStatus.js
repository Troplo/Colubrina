"use strict"

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Friends", "status", {
      type: Sequelize.ENUM(["pending", "accepted", "declined"]),
      allowNull: false,
      defaultValue: "pending"
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
