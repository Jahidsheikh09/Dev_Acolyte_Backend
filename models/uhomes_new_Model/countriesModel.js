module.exports = (sequelize, Sequelize) => {
  const Country = sequelize.define(
    "countries",
    {
      country_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
      },
      country_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      country_unique_name: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      ab: {
        type: Sequelize.STRING(8),
        allowNull: false,
        unique: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "countries",
    }
  );

  return Country;
};
