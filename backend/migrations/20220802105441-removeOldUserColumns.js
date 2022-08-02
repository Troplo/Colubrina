"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "guidedWizard")
    await queryInterface.removeColumn("Users", "emailDirectLogin")
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
