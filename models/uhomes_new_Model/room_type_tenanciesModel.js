module.exports = (sequelize, Sequelize) => {
  const RoomTypeTenancy = sequelize.define(
    "room_type_tenancies",
    {
      tenancy_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
      },
      house_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: "houses",
          key: "house_id",  
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      unit_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      lease_time: Sequelize.INTEGER,
      lease_time_max: Sequelize.INTEGER,
      lease_unit: Sequelize.STRING(16),
      booking_status: Sequelize.BIGINT.UNSIGNED,
      start_date: Sequelize.DATEONLY,
      start_date_max: Sequelize.DATEONLY,
      end_date: Sequelize.DATEONLY,
      end_date_max: Sequelize.DATEONLY,
      price_unit: Sequelize.INTEGER,
      term: Sequelize.STRING(32),
      rent_amount_value: Sequelize.DECIMAL(12, 2),
      rent_amount_abbr: Sequelize.STRING(8),
      rent_amount_max_value: Sequelize.DECIMAL(12, 2),
      rent_amount_max_abbr: Sequelize.STRING(8),
      promo_amount_value: Sequelize.DECIMAL(12, 2),
      promo_amount_abbr: Sequelize.STRING(8),
      has_final_promo_value: { type: Sequelize.TINYINT.UNSIGNED, defaultValue: 0 },
      has_promo: { type: Sequelize.TINYINT.UNSIGNED, defaultValue: 0 },
      sort: { type: Sequelize.INTEGER, defaultValue: 0 },
      service_tags_json: Sequelize.TEXT("long"),
      discount_lease_term_json: Sequelize.TEXT("long"),
      switch_json: Sequelize.TEXT("long"),
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "room_type_tenancies",
      indexes: [{ fields: ["house_id"] }, { fields: ["unit_id"] }],
    }
  );

  return RoomTypeTenancy;
};
