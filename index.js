const dotenv = require("dotenv");
const express = require("express");
const { graphqlHTTP } = require("express-graphql");
dotenv.config();
const schema = require("./graphql/schema");
const cors = require("cors");
const app = express();
const path = require("path");
const morgan = require("morgan");
const logger = require("./utils/logger");
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());

const { db } = require("./models");

// db.sequelize.sync({ force: false }).then(() => {
//   console.log("✅ Database (db) synced successfully.");
// });
// db.house.destroy({ force: false }).then(() => {
//   console.log("✅ Database (db) synced successfully.");
// });
// db.sequelize.sync({ alter: false }).then(() => {
//   console.log("✅ Database (db) synced successfully.");
// });

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: process.env.NODE_ENV === "development",
  })
);

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Acolyte" });
});

const publicDirectory = path.join(__dirname, "./public");
app.use(express.static(publicDirectory));

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: process.env.NODE_ENV === "development",
  })
);

require("./routes/properties.routes")(app);
require("./routes/house.routes")(app);
require("./routes/contact.routes")(app);
require("./routes/roomType.routes")(app);
require("./routes/utils.routes")(app);
app.use("/api/s3", require("./routes/s3.routes"));
require("./routes/uhomes_new_routes/houses.routes")(app);
require("./routes/uhomes_new_routes/houses.roomType.routes")(app);

app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server listening on ${PORT}`);
});
