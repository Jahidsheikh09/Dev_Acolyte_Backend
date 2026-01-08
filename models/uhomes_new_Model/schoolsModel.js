module.exports = (sequelize, Sequelize) => {
  const School = sequelize.define(
    "schools",
    {
      school_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
      },
      country_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: "countries",
          key: "country_id",
        },
      },
      city_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: "cities",
          key: "city_id",
        },
      },
      ab: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      school_unique_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      school_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      weight: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      loc_lat: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      },
      loc_lng: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      },
      loc_address: {
        type: Sequelize.STRING(600),
        allowNull: true,
      },
      loc_place_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "schools",
      indexes: [{ fields: ["country_id"] }, { fields: ["city_id"] }],
    }
  );

  return School;
};
