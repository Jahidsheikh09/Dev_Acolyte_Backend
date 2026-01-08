module.exports = (app) => {
  const properties = require("../controllers/properties.controller.js");

  var router = require("express").Router();

  router.get("/s3/presigned-url", properties.getPresignedUrlProperties);
  router.post("/sync", properties.syncOnePropertieInDatabase);
  router.post("/sync-many/all-list", properties.syncManyPropertiesInDatabase);

  router.put("/syncCountryCityOnly/update", properties.syncCountryCityOnly);

  // Insert temp filter images
  // router.post("/insert-images", properties.insertAllImages);
  router.post("/insert-all-images", properties.insertAllCountryImages);
  router.get("/missing-images", properties.syncMissingUpdatedImages);
  router.post("/compare/filter-image/new", properties.compareImageswithPropertyTable);

  router.get("/", properties.getAllProperties);
  router.get("/getMapMarkers", properties.getMapMarkers);
  router.get("/getAllUniversities", properties.getAllUniversities);
  router.get("/getAllPropertyTitles", properties.getAllPropertyTitles);
  router.get("/globalSearchofProperty", properties.globalSearchofProperty);
  router.get("/getTopCities", properties.getTopCities);
  router.get("/getTopUniversities", properties.getTopUniversities);
  router.get("/getTopRoomTypes", properties.getTopRoomTypes);
  router.get("/getAllHouseIds", properties.getAllHouseId);

  router.get("/:id", properties.getPropertyById);

  router.get("/filters/cities", properties.getAvailableCities);
  router.get("/filters/suppliers", properties.getAvailableSuppliers);
  router.get("/filters/price-range", properties.getPriceRange);
  router.get("/filters/amenities", properties.getAvailableAmenities);
  router.get("/filters/universities", properties.getUniversitiesByCity);
  router.get("/filters/roomTypes", properties.getAvailableRoomTypes);

  // "/:city_unique_name/:school_unique_name?",
  router.get(
    "/:country_unique_name/:city_unique_name/:school_unique_name?",
    async (req, res) => {
      req.query.country_unique_name = req.params.country_unique_name;
      req.query.city_unique_name = req.params.city_unique_name;
      req.query.school_unique_name = req.params.school_unique_name;
      return properties.getAllProperties(req, res);
    }
  );

  router.get("/stats/summary", properties.getPropertiesStats);

  router.put(
    "/bulk-update-images",
    (req, res, next) => {
      // Set a longer timeout for this specific route
      req.setTimeout(300000); // 5 minutes
      res.setTimeout(300000);
      next();
    },
    properties.bulkUpdateImagesAll
  );

  app.use("/api/properties", router);
};
