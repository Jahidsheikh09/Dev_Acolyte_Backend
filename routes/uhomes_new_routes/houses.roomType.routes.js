module.exports = (app) => {
  const controller = require("../../controllers/uhomes_new_controller/houseRoomTypeController");
  const router = require("express").Router();

  router.get("/:id", controller.getAllRoomTypes);

  app.use("/api/house-room-types", router);
};
