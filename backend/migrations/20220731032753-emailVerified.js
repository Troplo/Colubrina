"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "emailVerified", {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    })
    await queryInterface.addColumn("Users", "emailToken", {
      type: Sequelize.STRING,
      defaultValue: null
    })
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
