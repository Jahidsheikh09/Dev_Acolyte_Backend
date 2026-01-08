module.exports = (sequelize, Sequelize) => {
  const MissingImages = sequelize.define(
    "missing_images",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      house_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "missing_images",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return MissingImages;
};
