module.exports = (sequelize, Sequelize) => {
  const TempImage = sequelize.define(
    "images",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      images: {
        type: Sequelize.STRING,
        unique: true,
      },
    },
    {
      timestamps: true,
      freezeTableName: true,
      tableName: "images",
    }
  );

  return TempImage;
};
