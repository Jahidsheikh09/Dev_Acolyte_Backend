const { ref } = require("joi");

module.exports = (sequelize, Sequelize) => {
  const City = sequelize.define(
    "cities",
    {
      city_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
      },
      country_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: "countries",
          key: "country_id",
        },
      },
      state_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: "states",
          key: "state_id",
        },
      },
      city_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      city_unique_name: {
        type: Sequelize.STRING(128),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "cities",
      indexes: [{ fields: ["country_id"] }, { fields: ["state_id"] }],
    }
  );

  return City;
};
