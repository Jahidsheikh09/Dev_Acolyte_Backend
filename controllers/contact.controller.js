const { db } = require("../models");
const Lead = db.leads;

const Partnership = db.partnerships;

// Create and save a new partnership application
exports.createPartnership = async (req, res) => {
  try {
    // Validate request
    if (!req.body.firstName || !req.body.lastName || !req.body.email) {
      return res.status(400).send({
        message: "First name, last name, and email are required fields!",
      });
    }

    // Create a partnership object
    const partnership = {
      partnerType: req.body.partnerType || "property-owners",
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone || null,
      company: req.body.company,
      position: req.body.position,
      location: req.body.location,
      propertyCount: req.body.propertyCount || null,
      expectedRevenue: req.body.expectedRevenue,
      experience: req.body.experience || null,
      website: req.body.website || null,
      currentBusinessVolume: req.body.currentBusinessVolume || null,
      preferredContactTime: req.body.preferredContactTime || null,
      referralSource: req.body.referralSource || null,
      message: req.body.message || null,
      status: "pending_review",
      agreeToTerms: req.body.agreeToTerms || false,
      agreeToMarketing: req.body.agreeToMarketing || false,
      agreeToDataProcessing: req.body.agreeToDataProcessing || false,
      source: req.body.source || "website",
      submittedAt: new Date(),
    };

    // Save partnership in the database
    const data = await Partnership.create(partnership);

    res.status(201).send(data);
  } catch (err) {
    res.status(500).send({
      message:
        err.message ||
        "Some error occurred while creating the partnership application.",
    });
  }
};

// Create and save a new lead
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.name || !req.body.email) {
      return res.status(400).send({
        message: "Name and email are required fields!",
      });
    }

    // Create a lead object
    const lead = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || null,
      location: req.body.location || null,
      moveInDate: req.body.moveInDate || null,
      duration: req.body.duration || null,
      source: req.body.source || "website",
      notes: req.body.notes || null,
    };

    // Save lead in the database
    const data = await Lead.create(lead);

    res.status(201).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the lead.",
    });
  }
};
