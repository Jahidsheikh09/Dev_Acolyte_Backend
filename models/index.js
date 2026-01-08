const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.db.DB, dbConfig.db.USER, dbConfig.db.PASSWORD, {
  host: dbConfig.db.HOST,
  dialect: "mysql",
  // dialect: dbConfig.db.dialect,

  pool: {
    max: dbConfig.db.pool.max,
    min: dbConfig.db.pool.min,
    acquire: dbConfig.db.pool.acquire,
    idle: dbConfig.db.pool.idle,
  },
});

sequelize
  .authenticate()
  .then(() => {
    console.log("MySQL connected successfully");
  })
  .catch((err) => {
    console.error("MySQL connection error:", err.message);
  });

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Existing models
db.properties = require("./properties.model.js")(sequelize, Sequelize);
db.house = require("./house.model.js")(sequelize, Sequelize);
db.house_media = require("./house_media.model.js")(sequelize, Sequelize);
db.property_listing = require("./property_listing.model.js")(sequelize, Sequelize);
db.leads = require("./leads.model.js")(sequelize, Sequelize);
db.partnerships = require("./partnership.model.js")(sequelize, Sequelize);
db.room_type = require("./room-type.model.js")(sequelize, Sequelize);
db.images = require("./tempImage.model.js")(sequelize, Sequelize);
db.missing_images = require("./missingHouseImage.model.js")(sequelize, Sequelize);

// Uhomes New Models
db.amenities = require("./uhomes_new_Model/amenitiesModel.js")(sequelize, Sequelize);
db.house_amenities = require("./uhomes_new_Model/house_amenitiesModel.js")(
  sequelize,
  Sequelize
);
db.house_advisors = require("./uhomes_new_Model/house_advisorsModel.js")(
  sequelize,
  Sequelize
);
db.house_locations = require("./uhomes_new_Model/house_locationModel.js")(
  sequelize,
  Sequelize
);
db.house_navigate = require("./uhomes_new_Model/house_navigateModel.js")(
  sequelize,
  Sequelize
);
db.house_schools = require("./uhomes_new_Model/house_schoolsModel.js")(
  sequelize,
  Sequelize
);
db.house_service_tags = require("./uhomes_new_Model/house_service_tagsModel.js")(
  sequelize,
  Sequelize
);
db.house_switches = require("./uhomes_new_Model/house_switchesModel.js")(
  sequelize,
  Sequelize
);
db.house_tags = require("./uhomes_new_Model/house_tagsModel.js")(sequelize, Sequelize);
db.house_tips = require("./uhomes_new_Model/house_tipsModel.js")(sequelize, Sequelize);
db.house_room_types = require("./uhomes_new_Model/houseRoomTypeModel.js")(
  sequelize,
  Sequelize
);
db.houses = require("./uhomes_new_Model/housesModel.js")(sequelize, Sequelize);
db.room_type_tenancies = require("./uhomes_new_Model/room_type_tenanciesModel.js")(
  sequelize,
  Sequelize
);
db.school_traffic = require("./uhomes_new_Model/school_trafficModel.js")(
  sequelize,
  Sequelize
);
db.listing_pages = require("./uhomes_new_Model/listing_pagesModel.js")(
  sequelize,
  Sequelize
);
db.service_tags = require("./uhomes_new_Model/service_tagsModel.js")(
  sequelize,
  Sequelize
);
db.suppliers = require("./uhomes_new_Model/suppliersModel.js")(sequelize, Sequelize);
db.tags = require("./uhomes_new_Model/tagsModel.js")(sequelize, Sequelize);

db.schools = require("./uhomes_new_Model/schoolsModel.js")(sequelize, Sequelize);
db.cities = require("./uhomes_new_Model/citiesModel.js")(sequelize, Sequelize);
db.states = require("./uhomes_new_Model/statesModel.js")(sequelize, Sequelize);
db.countries = require("./uhomes_new_Model/countriesModel.js")(sequelize, Sequelize);

// Country Associations
db.countries.hasMany(db.states, {
  foreignKey: "country_id",
  as: "states",
});
db.countries.hasMany(db.cities, {
  foreignKey: "country_id",
  as: "cities",
});
db.countries.hasMany(db.schools, {
  foreignKey: "country_id",
  as: "schools",
});
db.countries.hasMany(db.houses, {
  foreignKey: "country_id",
  as: "houses",
});

// State Associations
db.states.belongsTo(db.countries, {
  foreignKey: "country_id",
  as: "country",
});
db.states.hasMany(db.cities, {
  foreignKey: "state_id",
  as: "cities",
});
db.states.hasMany(db.houses, {
  foreignKey: "state_id",
  as: "houses",
});

// City Associations
db.cities.belongsTo(db.states, {
  foreignKey: "state_id",
  as: "state",
});
db.cities.belongsTo(db.countries, {
  foreignKey: "country_id",
  as: "country",
});
db.cities.hasMany(db.schools, {
  foreignKey: "city_id",
  as: "schools",
});
db.cities.hasMany(db.houses, {
  foreignKey: "city_id",
  as: "houses",
});

// Supplier Associations
db.suppliers.hasMany(db.houses, {
  foreignKey: "supplier_id",
  as: "houses",
});
db.houses.belongsTo(db.suppliers, {
  foreignKey: "supplier_id",
  as: "supplier",
});

// Houses Associations
db.houses.hasOne(db.house_tips, {
  foreignKey: "house_id",
  as: "house_tips",
});
db.house_tips.belongsTo(db.houses, {
  foreignKey: "house_id",
  as: "house",
});

db.houses.hasMany(db.house_room_types, {
  foreignKey: "house_id",
  as: "house_room_types",
});
db.house_room_types.belongsTo(db.houses, {
  foreignKey: "house_id",
  as: "house",
});

db.houses.hasMany(db.room_type_tenancies, {
  foreignKey: "house_id",
  as: "room_type_tenancies",
});
db.room_type_tenancies.belongsTo(db.houses, {
  foreignKey: "house_id",
  as: "house",
});

db.houses.hasMany(db.house_service_tags, {
  foreignKey: "house_id",
  as: "house_service_tags",
});
db.house_service_tags.belongsTo(db.houses, {
  foreignKey: "house_id",
  as: "house",
});
db.houses.hasMany(db.house_tags, {
  foreignKey: "house_id",
  as: "house_tags",
});
db.house_tags.belongsTo(db.houses, {
  foreignKey: "house_id",
  as: "house",
});

db.houses.hasMany(db.house_schools, {
  foreignKey: "house_id",
  as: "house_schools",
});
db.house_schools.belongsTo(db.houses, {
  foreignKey: "house_id",
  as: "house",
});

db.houses.hasMany(db.house_locations, {
  foreignKey: "house_id",
  as: "house_locations",
});
db.house_locations.belongsTo(db.houses, {
  foreignKey: "house_id",
  as: "house",
});

db.houses.hasMany(db.house_navigate, {
  foreignKey: "house_id",
  as: "house_navigate",
});
db.house_navigate.belongsTo(db.houses, {
  foreignKey: "house_id",
  as: "house",
});

db.houses.hasMany(db.house_advisors, {
  foreignKey: "house_id",
  as: "house_advisors",
});
db.house_advisors.belongsTo(db.houses, {
  foreignKey: "house_id",
  as: "house",
});

db.houses.hasMany(db.house_switches, {
  foreignKey: "house_id",
  as: "house_switches",
});
db.house_switches.belongsTo(db.houses, {
  foreignKey: "house_id",
  as: "house",
});

db.houses.hasMany(db.school_traffic, {
  foreignKey: "house_id",
  as: "school_traffic",
});
db.school_traffic.belongsTo(db.houses, {
  foreignKey: "house_id",
  as: "house",
});

db.houses.belongsTo(db.countries, {
  foreignKey: "country_id",
  as: "country",
});
db.houses.belongsTo(db.states, {
  foreignKey: "state_id",
  as: "state",
});
db.houses.belongsTo(db.cities, {
  foreignKey: "city_id",
  as: "city",
});

// Amenity Associations
db.amenities.hasMany(db.house_amenities, {
  foreignKey: "amenity_id",
  as: "house_amenities",
});
db.house_amenities.belongsTo(db.amenities, {
  foreignKey: "amenity_id",
  as: "amenities",
});

db.houses.hasMany(db.house_amenities, {
  foreignKey: "house_id",
  as: "house_amenities",
});
db.house_amenities.belongsTo(db.houses, {
  foreignKey: "house_id",
  as: "houses",
});

// tag Associations
db.tags.hasMany(db.house_tags, {
  foreignKey: "tag_id",
  as: "house_tags",
});
db.house_tags.belongsTo(db.tags, {
  foreignKey: "tag_id",
  as: "tag",
});

// School Associations
db.schools.hasMany(db.school_traffic, {
  foreignKey: "school_id",
  as: "school_traffic",
});
db.school_traffic.belongsTo(db.schools, {
  foreignKey: "school_id",
  as: "school",
});

db.schools.belongsTo(db.countries, {
  foreignKey: "country_id",
  as: "country",
});
db.schools.belongsTo(db.cities, {
  foreignKey: "city_id",
  as: "city",
});

db.house_media.belongsTo(db.house, {
  foreignKey: "house_id",
});
db.house.hasMany(db.house_media, {
  foreignKey: "house_id",
});

module.exports = { db };
