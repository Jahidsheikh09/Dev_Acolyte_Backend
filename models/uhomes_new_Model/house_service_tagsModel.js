module.exports = (sequelize, Sequelize) => {
  const HouseServiceTag = sequelize.define(
    "house_service_tags",
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
      service_tag_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "service_tags",
          key: "service_tag_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "house_service_tags",
    }
  );

  return HouseServiceTag;
};
