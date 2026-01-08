const express = require("express");
const router = express.Router();

const { generatePresignedUrl } = require("../controllers/s3.controller");

router.get("/presigned-url", generatePresignedUrl);

module.exports = router;
