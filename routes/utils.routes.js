module.exports = (app) => {
	const utils = require("../controllers/utils.controller.js");
	var router = require("express").Router();

	router.get("/getCountry", utils.getCountryAndCities);

	app.use("/api/utils", router);
};