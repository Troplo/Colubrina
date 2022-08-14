"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("PollAnswers", "createdAt", {
      type: Sequelize.DATE,
      allowNull: false
    })
    await queryInterface.addColumn("PollAnswers", "updatedAt", {
      type: Sequelize.DATE,
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
