const { db } = require("../../models");
const Houses = db.houses;
const house_amenities = db.house_amenities;
const house_advisors = db.house_advisors;
const house_locations = db.house_locations;
const house_navigate = db.house_navigate;
const house_schools = db.house_schools;
const house_service_tags = db.house_service_tags;
const house_tags = db.house_tags;
const house_room_types = db.house_room_types;
const room_type_tenancies = db.room_type_tenancies;
const school_traffic = db.school_traffic;
const house_tips = db.house_tips;
const house_switches = db.house_switches;

const getHousesById = async (_, { id }) => {
  const house = await Houses.findOne({
    where: { house_id: Number(id) },
    include: [
      { model: house_advisors, as: "house_advisors" },
      { model: house_amenities, as: "house_amenities" },
      { model: house_locations, as: "house_locations" },
      { model: house_navigate, as: "house_navigate" },
      { model: house_schools, as: "house_schools" },
      { model: house_service_tags, as: "house_service_tags" },
      { model: house_switches, as: "house_switches" },
      { model: house_tags, as: "house_tags" },
      { model: house_tips, as: "house_tips" },
      { model: house_room_types, as: "house_room_types" },
      { model: room_type_tenancies, as: "room_type_tenancies" },
      { model: school_traffic, as: "school_traffic" },
    ],
  });

  if (!house) {
    throw new Error("House Not Found");
  }

  return house;
};

module.exports = {
  getHousesById,
};
