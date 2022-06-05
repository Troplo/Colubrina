"use strict"

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Messages", "edited", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
    await queryInterface.addColumn("Messages", "editedAt", {
      type: Sequelize.DATE,
      allowNull: true
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
