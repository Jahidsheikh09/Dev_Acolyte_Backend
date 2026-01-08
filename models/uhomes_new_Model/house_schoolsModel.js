module.exports = (sequelize, Sequelize) => {
  const HouseSchool = sequelize.define(
    "house_schools",
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
      school_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
      },
      house_count_shelve: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      distance: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      polyline_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "house_schools",
    }
  );

  return HouseSchool;
};
