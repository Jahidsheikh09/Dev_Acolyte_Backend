// models/propertyModel.js
module.exports = (sequelize, Sequelize) => {
  const Property = sequelize.define(
    "properties",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      house_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      },
      lng: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      },
      rent_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      rent_currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: "GBP",
      },
      promo_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      original_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      lease_unit: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: "WEEK",
      },
      images: {
        type: Sequelize.JSON, // Array of image URLs
        allowNull: true,
      },
      updated_images: {
        type: Sequelize.JSON, // Array of image URLs
        allowNull: true,
      },
      amenities: {
        type: Sequelize.JSON, // Array of amenity objects
        allowNull: true,
      },
      room_types: {
        type: Sequelize.JSON, // Array of room type objects
        allowNull: true,
      },
      tags: {
        type: Sequelize.JSON, // Array of tag objects
        allowNull: true,
      },
      school_info: {
        type: Sequelize.JSON, // School and transportation data
        allowNull: true,
      },
      reviews: {
        type: Sequelize.JSON, // Reviews data
        allowNull: true,
      },
      contacts: {
        type: Sequelize.JSON, // Contact information
        allowNull: true,
      },
      supplier_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bed_num: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      total_floor: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      favorite_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      booking_status: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      country: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      city: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      min_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      freezeTableName: true,
      tableName: "properties",
      indexes: [
        {
          fields: ["house_id"],
        },
        {
          fields: ["city_name"],
        },
        {
          fields: ["rent_amount"],
        },
        {
          fields: ["is_active"],
        },
      ],
    }
  );

  return Property;
};
