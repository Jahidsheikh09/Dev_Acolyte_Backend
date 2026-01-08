module.exports = (sequelize, Sequelize) => {
  const HouseTag = sequelize.define(
    "house_tags",
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
      tag_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "tags",
          key: "tag_id",  
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      sort: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "house_tags",
    }
  );

  return HouseTag;
};
