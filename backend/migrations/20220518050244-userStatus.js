"use strict"

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Users", "status", {
      type: Sequelize.ENUM(["online", "busy", "away", "offline", "invisible"]),
      allowNull: false,
      defaultValue: "offline"
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
