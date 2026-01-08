const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const verifyRequest = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    console.log("Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Unauthorized: Missing or malformed token");
      return res.status(403).send("Unauthorized: Missing or malformed token");
    }

    const token = authHeader.split(" ")[1].trim();

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("Unauthorized: Invalid Token", err);
        return res.status(403).send("Unauthorized: Invalid Token");
      }

      console.log("Token verified successfully");
      console.log("Decoded Token:", decoded);

      req.user = decoded; // optionally attach user info to request
      next();
    });
  } catch (error) {
    console.error("Error in verifyRequest:", error);
    return res.status(500).json({
      status: false,
      code: 500,
      message: "Internal Server Error",
    });
  }
};

module.exports = { verifyRequest };
