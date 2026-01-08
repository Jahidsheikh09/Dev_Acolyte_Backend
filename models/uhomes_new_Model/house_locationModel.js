module.exports = (sequelize, Sequelize) => {
  const HouseLocation = sequelize.define(
    "house_locations",
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
      address: {
        type: Sequelize.STRING(600),
        allowNull: false,
      },
      zipcode: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      lat: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      },
      lng: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      },
      place_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      street_view_lat: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      },
      street_view_lng: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "house_locations",
    }
  );

  return HouseLocation;
};
