module.exports = (sequelize, Sequelize) => {
  const Tag = sequelize.define(
    "tags",
    {
      tag_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      color: {
        type: Sequelize.STRING(16),
        allowNull: true,
      },
      bg_color: {
        type: Sequelize.STRING(16),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "tags",
    }
  );

  return Tag;
};
