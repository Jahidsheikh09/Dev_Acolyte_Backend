module.exports = (app) => {
  const Room = require("../controllers/roomType.controller");
  const router = require("express").Router();

  // Insert Room Type Data
  // /api/room-type/insert-room-type-data
  router.post("/insert-room-type-data", Room.insertRoomTypeData);
  router.get("/:id", Room.getRoomTypeById);

  app.use("/api/room-type", router);
};
