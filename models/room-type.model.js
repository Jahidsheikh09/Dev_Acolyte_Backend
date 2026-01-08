module.exports = (sequelize, Sequelize) => {
  const RoomType = sequelize.define(
    "room_type",
    {
      house_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      bathroom: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      bed_size: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      bed_style: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      kitchen: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      orientation: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      room_type: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      room_type_items: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      media_url: { type: Sequelize.JSON, allowNull: true },
      switch: {
        type: Sequelize.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "room_type",
    }
  );

  return RoomType;
};
