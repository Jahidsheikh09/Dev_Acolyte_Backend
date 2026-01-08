module.exports = (sequelize, Sequelize) => {
  const HouseSwitch = sequelize.define(
    "house_switches",
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
      is_favorite: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      is_submit_from: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      is_has_live: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      is_has_video: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      is_has_vr: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      ranking: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      is_exclusive_offer: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      is_exclusive_listing: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      is_login_customer_house: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      show_review_count: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      on_site_verification: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      on_site_video: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      is_show_waiting: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      is_show_sold_out: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      is_agent_report: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      is_house_report: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      is_ten_years_anniversary: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "house_switches",
    }
  );

  return HouseSwitch;
};
