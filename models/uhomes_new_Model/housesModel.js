module.exports = (sequelize, Sequelize) => {
  const House = sequelize.define(
    "houses",
    {
      house_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
      },
      sku: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },

      type_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },

      sub_type_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },

      sub_type: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },

      cust_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      supplier_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: "suppliers",
          key: "supplier_id",
        },
      },
      city_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: "cities",
          key: "city_id",
        },
      },
      state_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: "states",
          key: "state_id",
        },
      },
      country_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: "countries",
          key: "country_id",
        },
      },

      house_status: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },

      publish_type: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },

      has_sublease: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
      },

      title: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },

      booking_status: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },

      favorite_count: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },

      lease_unit: {
        type: Sequelize.STRING(16),
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

      min_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      house_url: {
        type: Sequelize.STRING(512),
        allowNull: true,
      },

      ranking: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },

      supplier_logo: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      bed_num: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },

      total_floor: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },

      room_type_count: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },

      hasReleased: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      media_image_paths: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      raw_payload_json: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      source_city_unique_name: {
        type: Sequelize.STRING(128),
        allowNull: true,
      },

      source_country_unique_name: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },

      room_types_done: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      room_types_updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      raw_room_type_payload: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      has_room_types: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      room_type_payload: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      raw_room_type_payload_json: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },

      room_type_image_paths: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },

      room_types_status: {
        type: Sequelize.ENUM("PENDING", "PROCESSING", "DONE", "ERROR"),
        defaultValue: "PENDING",
      },

      room_types_worker: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },

      room_types_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },

      room_types_last_error: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true,
      tableName: "houses",
      indexes: [
        { fields: ["city_id"] },
        { fields: ["country_id"] },
        { fields: ["house_status"] },
        { fields: ["booking_status"] },
      ],
    }
  );

  return House;
};
