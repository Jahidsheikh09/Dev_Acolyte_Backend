const { ref } = require("joi");

module.exports = (sequelize, Sequelize) => {
  const HouseAdvisor = sequelize.define(
    "house_advisors",
    {
      house_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "houses",
          key: "house_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      owner_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      nickname: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      picture: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      mobile_w_cc: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      mobile_w: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      whatsapp_cc: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      whatsapp_mobile: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      staff_status: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      contact_type: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      count_val: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "house_advisors",
    }
  );

  return HouseAdvisor;
};
