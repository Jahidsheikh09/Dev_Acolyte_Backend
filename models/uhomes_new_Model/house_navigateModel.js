module.exports = (sequelize, Sequelize) => {
  const HouseNavigate = sequelize.define(
    "house_navigate",
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
      seq: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING(512),
        allowNull: false,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "house_navigate",
    }
  );

  return HouseNavigate;
};
