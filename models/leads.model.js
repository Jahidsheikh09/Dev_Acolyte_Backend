// models/Lead.js
module.exports = (sequelize, Sequelize) => {
  const Lead = sequelize.define("lead", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true
    },
    location: {
      type: Sequelize.STRING,
      allowNull: true
    },
    moveInDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    duration: {
      type: Sequelize.STRING,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('new', 'contacted', 'qualified', 'converted', 'lost'),
      defaultValue: 'new'
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    source: {
      type: Sequelize.STRING,
      allowNull: true
    }
  }, {
    timestamps: true, // Adds createdAt and updatedAt
    freezeTableName: true,
    tableName: "leads"
  });

  return Lead;
};