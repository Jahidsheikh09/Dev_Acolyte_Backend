// models/houseRoomTypeModel.js
module.exports = (sequelize, Sequelize) => {
  const HouseRoomType = sequelize.define(
    "house_room_types",
    {
      room_type_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
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

      sku: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },

      type_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },

      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      booking_status: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },

      sort: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      lease_unit: {
        type: Sequelize.STRING(16),
        allowNull: true,
      },

      bed_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      bedroom_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      bathroom_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      bathroom_style_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },

      kitchen_type: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },

      rent_amount_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },

      rent_amount_abbr: {
        type: Sequelize.STRING(8),
        allowNull: true,
      },

      promo_price_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },

      promo_price_abbr: {
        type: Sequelize.STRING(8),
        allowNull: true,
      },

      original_price_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },

      original_price_abbr: {
        type: Sequelize.STRING(8),
        allowNull: true,
      },

      area_sqm_json: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },

      area_sqft_json: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },

      amenities_json: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },

      tags_json: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },

      switch_json: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },

      media_image_paths: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },

      media_json: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },

      floor_plan_json: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },

      double_policy_json: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "house_room_types",
      indexes: [
        { fields: ["house_id"] },
        { fields: ["unit_id"] },
        { fields: ["type_id"] },
        { fields: ["booking_status"] },
      ],
    }
  );

  return HouseRoomType;
};
