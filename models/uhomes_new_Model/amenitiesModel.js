module.exports = (sequelize, Sequelize) => {
  const Amenity = sequelize.define(
    "amenities",
    {
      amenity_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      icon_font: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "amenities",
    }
  );

  return Amenity;
};
