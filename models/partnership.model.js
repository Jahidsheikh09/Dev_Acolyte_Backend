// models/Partnership.js
module.exports = (sequelize, Sequelize) => {
  const Partnership = sequelize.define("partnership", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    partnerType: {
      type: Sequelize.STRING,
      allowNull: false
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lastName: {
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
      allowNull: false
    },
    company: {
      type: Sequelize.STRING,
      allowNull: false
    },
    position: {
      type: Sequelize.STRING,
      allowNull: false
    },
    location: {
      type: Sequelize.STRING,
      allowNull: false
    },
    propertyCount: {
      type: Sequelize.STRING,
      allowNull: true
    },
    expectedRevenue: {
      type: Sequelize.STRING,
      allowNull: false
    },
    experience: {
      type: Sequelize.STRING,
      allowNull: true
    },
    website: {
      type: Sequelize.STRING,
      allowNull: true
    },
    currentBusinessVolume: {
      type: Sequelize.STRING,
      allowNull: true
    },
    preferredContactTime: {
      type: Sequelize.STRING,
      allowNull: true
    },
    referralSource: {
      type: Sequelize.STRING,
      allowNull: true
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('pending_review', 'contacted', 'qualified', 'approved', 'rejected'),
      defaultValue: 'pending_review'
    },
    agreeToTerms: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    agreeToMarketing: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    agreeToDataProcessing: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    source: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'website'
    },
    submittedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  }, {
    timestamps: true,
    underscored: true
  });

  return Partnership;
};