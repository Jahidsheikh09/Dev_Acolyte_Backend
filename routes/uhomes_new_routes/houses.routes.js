module.exports = (app) => {
  const housesController = require("../../controllers/uhomes_new_controller/housesController");
  const router = require("express").Router();

  router.get(
    "/:country_unique_name/:city_unique_name/:school_unique_name?",
    async (req, res) => {
      req.query.country_unique_name = req.params.country_unique_name;
      req.query.city_unique_name = req.params.city_unique_name;
      req.query.school_unique_name = req.params.school_unique_name;
      return housesController.getHousesList(req, res);
    }
  );

  router.get("/list", housesController.getHousesList);
  router.get("/all", housesController.getAllHouses);
  router.get("/details/:id", housesController.getHouseById);

  router.get("/amenities/:id", housesController.getHouseAmenitiesById);
  router.get("/advisors/:id", housesController.getHouseAdvisorsById);
  router.get("/locations/:id", housesController.getHouseLocationsById);
  router.get("/navigate/:id", housesController.getHouseNavigateById);
  router.get("/room_types/:id", housesController.getHouse_room_typesById);
  router.get("/schools/:id", housesController.getHouseSchoolsById);
  router.get("/service_tags/:id", housesController.getHouseServiceTagsById);
  router.get("/switches/:id", housesController.getHouseSwitchesById);
  router.get("/tags/:id", housesController.getHouseTagsById);
  router.get("/tips/:id", housesController.getHouseTipsById);
  router.get("/room_type_tenancies/:id", housesController.getRoom_type_tenanciesById);
  router.get("/school_traffic/:id", housesController.getSchoolTrafficById);

  app.use("/api/houses", router);
};
