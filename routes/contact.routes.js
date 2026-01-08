module.exports = (app) => {
  const contact = require("../controllers/contact.controller.js");
  var router = require("express").Router();

  router.post("/create", contact.create);
  router.post("/partnership", contact.createPartnership);

  app.use("/api/contact", router);
};
