module.exports = (sequelize, Sequelize) => {
  const House = sequelize.define(
    "house",
    {
      house_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      data: {
        type: Sequelize.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "house",
    }
  );

  return House;
};
