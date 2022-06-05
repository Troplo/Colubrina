"use strict"

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Users", "totp", {
      type: Sequelize.TEXT,
      allowNull: true
    })
    await queryInterface.addColumn("Users", "totpEnabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
    await queryInterface.addColumn("Users", "emailDirectLogin", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
    await queryInterface.addColumn("Users", "email", {
      type: Sequelize.STRING,
      allowNull: true
    })
    await queryInterface.addColumn("Users", "bcSessions", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
