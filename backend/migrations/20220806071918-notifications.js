"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ChatAssociations", "notifications", {
      type: Sequelize.ENUM(["all", "none", "mentions"]),
      defaultValue: "all",
      allowNull: false
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
