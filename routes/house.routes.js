module.exports = (app) => {
  const house = require("../controllers/house.controller.js");
  var router = require("express").Router();

  router.get("/get-all-house", house.getAllHouse);
  router.get("/get-one-house", house.getOneHouse);
  router.get("/:id", house.getHouseMediaById);

  // insert house data in house table
  router.post("/insert/house-data", house.insertDataInHouseTable);

  //insert all media images in house_media form house table
  router.post("/insert/houseMedia-data", house.insertAllHouseMediaImages);

  // compare images in house_media table with temp Images
  router.post("/compare-images-data", house.compareAllImagesInHouseMedia);

  // compare images in properties table with temp Images
  router.post("/compare-images-property", house.compareImageswithPropertyTable);

  app.use("/api/house", router);
};

