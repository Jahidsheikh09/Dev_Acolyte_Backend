module.exports = (sequelize, Sequelize) => {
  const ServiceTag = sequelize.define(
    "service_tags",
    {
      service_tag_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "service_tags",
    }
  );

  return ServiceTag;
};
