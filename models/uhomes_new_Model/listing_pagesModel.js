module.exports = (sequelize, Sequelize) => {
  const ListingPage = sequelize.define(
    "listing_pages",
    {
      page_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      country_unique_name: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      city_unique_name: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      params_string: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      total: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      per_page: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      current_page: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 1,
      },
      last_page: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      page_more: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },
      raw_page_json: {
        type: Sequelize.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "listing_pages",
      indexes: [{ fields: ["country_unique_name", "city_unique_name"] }],
    }
  );

  return ListingPage;
};
