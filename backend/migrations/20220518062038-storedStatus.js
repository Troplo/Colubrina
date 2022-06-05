"use strict"

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Users", "storedStatus", {
      type: Sequelize.ENUM(["online", "busy", "away", "invisible"]),
      allowNull: false,
      defaultValue: "online"
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
