const { ref } = require("joi");

module.exports = (sequelize, Sequelize) => {
  const SchoolTraffic = sequelize.define(
    "school_traffic",
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
        references: {
          model: "schools",
          key: "school_id", 
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      traffic_type: {
        type: Sequelize.STRING(32),
        primaryKey: true,
        allowNull: false,
      },
      distance: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      duration: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "school_traffic",
      indexes: [{ fields: ["house_id"] }, { fields: ["school_id"] }],
    }
  );

  return SchoolTraffic;
};
