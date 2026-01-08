// models/processedHouseModel.js
module.exports = (sequelize, Sequelize) => {
  const ProcessedHouse = sequelize.define("processed_houses", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    original_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true,
      comment: "Reference to original house.idhouse"
    },
    name: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Property name"
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Main property description"
    },
    address: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Property full address"
    },
    postal_code: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Property postal code"
    },
    city: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "City name"
    },
    rent_amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: "Current rent price"
    },
    original_price: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: "Original price before discount"
    },
    advance_payment: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: "Required advance payment"
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: true,
      defaultValue: 'GBP',
      comment: "Currency code"
    },
    lease_unit: {
      type: Sequelize.STRING(10),
      allowNull: true,
      defaultValue: 'WEEK',
      comment: "Rent period unit (WEEK, MONTH)"
    },
    property_features: {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "Property features and highlights"
    },
    amenities: {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "Available amenities"
    },
    room_types: {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "Available room types"
    },
    building_info: {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "Building details (total units, floors, etc)"
    },
    universities_nearby: {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "Nearby universities with travel times"
    },
    attractions_nearby: {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "Nearby attractions"
    },
    transport_info: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Transportation information"
    },
    supplier_name: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Property supplier/management company"
    },
    faq_content: {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "FAQ questions and answers"
    },
    payment_options: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Available payment methods and options"
    },
    processed_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    is_processed: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    }
  }, {
    timestamps: true,
    freezeTableName: true,
    tableName: "processed_houses",
    indexes: [
      {
        fields: ['original_id']
      },
      {
        fields: ['city']
      },
      {
        fields: ['supplier_name']
      }
    ]
  });

  return ProcessedHouse;
};