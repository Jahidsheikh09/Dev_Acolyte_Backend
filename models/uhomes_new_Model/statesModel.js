module.exports = (sequelize, Sequelize) => {
  const State = sequelize.define(
    "states",
    {
      state_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
      },
      country_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: "countries",
          key: "country_id",
        },
      },
      state_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      state_unique_name: {
        type: Sequelize.STRING(128),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "states",
      indexes: [{ fields: ["country_id"] }],
    }
  );

  return State;
};
