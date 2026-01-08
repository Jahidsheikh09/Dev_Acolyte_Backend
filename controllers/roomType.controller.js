const { db } = require("../models");
const RoomType = db.room_type;
const sequelize = db.sequelize;
const path = require("path");
const fs = require("fs");
const { json } = require("sequelize");

exports.getRoomTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const roomtype = await RoomType.findOne({
      where: { house_id: id },
    });

    if (!roomtype) {
      return res.status(404).json({
        success: false,
        message: "Room Type not found By ID",
      });
    }

    return res.status(200).json({
      success: true,
      data: roomtype,
      message: "Room Type retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching Room Type:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.insertRoomTypeData = async (req, res) => {
  try {
    // const data = require("../../../data/NewPropertiesCountryWiseData/uk/Properties-RoomData-uk");
    const dirPath = path.join(
      __dirname,
      // "../../../data/NewPropertiesCountryWiseData/uk/Properties-RoomData-uk"
    );
    const files = fs.readdirSync(dirPath);
    let skipped = 0;
    let totalInserted = 0;

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const houseId = Number(file.replace(".json", ""));

      if (isNaN(houseId)) {
        console.log(`Invalid house_id filename: ${file}`);
        continue;
      }
      const existingEntry = await RoomType.findOne({
        where: { house_id: houseId },
      });

      if (existingEntry) {
        console.log(`Room type already exists for house_id ${houseId}. Skipping.`);
        skipped++;
        continue;
      }

      const jsonData = JSON.parse(fs.readFileSync(path.join(dirPath, file), "utf-8"));

      const roomArray = Array.isArray(jsonData) ? jsonData : [jsonData];

      const RoomData = [];

      roomArray.forEach((item) => {
        const roomTypeItems = item?.room_types?.room_type_items ?? [];
        const allRoomImages = roomTypeItems.flatMap((roomItem) => {
          const images = roomItem?.media?.image ?? [];
          return images
            .map((imgObj) => {
              try {
                const mediaImg = imgObj;
                if (!mediaImg?.path) return null;

                const clean = mediaImg?.path
                  .replace(/\.(webp|png|jpg|jpeg)$/i, "")
                  .replace(/_[a-zA-Z0-9]+$/, "")
                  .replace("_g", "");
                const key = clean.split("/").pop().split("_")[0];
                return `https://storage.googleapis.com/acolyte-living-img/new_images/${key}.webp`;
              } catch {
                return null;
              }
            })
            .filter(Boolean);
        });

        RoomData.push({
          house_id: houseId,
          bathroom: item.room_types.bathroom,
          bed_size: item.room_types.bed_size,
          bed_style: item.room_types.bed_style,
          kitchen: item.room_types.kitchen,
          orientation: item.room_types.orientation,
          room_type: item.room_types.room_type,
          room_type_items: item.room_types.room_type_items,
          media_url: allRoomImages,
          switch: item.room_types.switch,
        });
      });

      try {
        await RoomType.bulkCreate(RoomData);
        totalInserted++;
      } catch (err) {
        console.error(`Error inserting records for house_id ${houseId}:`, err);
      }
    }
    return res.status(200).json({
      success: true,
      message: "Room Types sync completed",
      totalInserted,
      skipped,
    });
  } catch (error) {
    console.error("Error syncing properties room types:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during Room Type sync",
    });
  }
};
