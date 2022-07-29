"use strict"

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Users", "font", {
      type: Sequelize.STRING,
      defaultValue: "Inter",
      allowNull: false
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
