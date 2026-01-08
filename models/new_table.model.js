module.exports = (sequelize, Sequelize) => {
  const NewTable = sequelize.define("new_table", {
    param_index: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    decrypted_data: {
      type: Sequelize.JSON,
      allowNull: true,
    },
  }, {
    timestamps: false,
    freezeTableName: true,
    tableName: "new_table",
  });

  return NewTable;
};
