module.exports = (sequelize, Sequelize) => {
  const HouseTip = sequelize.define(
    "house_tips",
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
      distance: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      is_show_available_room: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      available_room: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      sub_type_title: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      exclusive_is_exclusive_offer: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      exclusive_expired_time: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      exclusive_remain_time: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      exclusive_offer_amount_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      exclusive_offer_amount_abbr: {
        type: Sequelize.STRING(8),
        allowNull: true,
      },
      exclusive_desc: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      top_picks_rank: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      top_picks_title: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      ten_anniversary_json: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      exclusive_introduce_json: {
        type: Sequelize.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "house_tips",
    }
  );

  return HouseTip;
};
