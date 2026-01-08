module.exports = (sequelize, Sequelize) => {
  const Supplier = sequelize.define(
    "suppliers",
    {
      supplier_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      logo: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      originated: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      sub_type_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "suppliers",
      indexes: [
        { fields: ["sub_type_id"] },
      ],
    }
  );

  return Supplier;
};
