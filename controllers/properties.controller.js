const { db } = require("../models");
// const propertyModel = db.properties;
const Property = db.properties;
const TempImage = db.images;
const sequelize = db.sequelize; // ✅ use this
const { Op, literal, Sequelize, fn } = require("sequelize");
const path = require("path");
const fs = require("fs");

const newTableModel = db.new_table;
const data = require("../data/uhomes_results.json");
const {
  transformPropertyData,
  extractCountryCityOnly,
} = require("../utils/dataTransformer");
const { getSignedImageUrl } = require("../utils/s3SignedImage");
const { extractObjectKey } = require("../utils/mime");

const axios = require("axios"); // Add axios for HTTP requests
const uhomesCities = require(path.join(__dirname, "../city.json"));
// ^ adjust ../uhomes_cities.json path as per your project

const countryCityMap = uhomesCities.reduce((acc, item) => {
  const cc = String(item.countryCode || "")
    .toLowerCase()
    .trim();
  const city = String(item.cityName || "").trim();
  if (!cc || !city) return acc;
  if (!acc[cc]) acc[cc] = [];
  acc[cc].push(city);
  return acc;
}, {});

function jsonField(field, key) {
  // Example: JSON_UNQUOTE(JSON_EXTRACT(`country`, '$.country_unique_name'))
  return Sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(\`${field}\`, '$.${key}'))`);
}
function toSQLDate(dateString) {
  if (!dateString) return null;

  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;

  return d.toISOString().split("T")[0]; // "2025-01-03"
}

// Updated API function in your controller
exports.getMapMarkers = async (req, res) => {
  try {
    const { university } = req.query;

    if (!university) {
      return res.status(400).json({
        success: false,
        error: "University name is required",
      });
    }

    // Find properties near the specified university
    const properties = await Property.findAll({
      where: {
        is_active: true,
        [Op.and]: [
          { updated_images: { [Op.ne]: null } },
          Sequelize.where(Sequelize.fn("JSON_LENGTH", Sequelize.col("updated_images")), {
            [Op.gt]: 0,
          }),
          Sequelize.where(
            Sequelize.literal(
              "json_unquote(json_extract(`school_info`, '$.school_name'))"
            ),
            { [Op.like]: `%${university}%` }
          ),
        ],
      },
      order: [
        // Prioritize properties closer to the university
        Sequelize.literal("json_extract(`school_info`, '$.distance') ASC"),
        // Then by price
        ["rent_amount", "ASC"],
      ],
      limit: 50, // Reasonable number to show on map
    });

    // Get university details from the first property
    const universityInfo =
      properties.length > 0 && properties[0].school_info
        ? {
            name: properties[0].school_info.school_name,
            location: properties[0].school_info.location,
          }
        : null;

    // Transform data for map display
    const mapData = {
      university: universityInfo,
      properties: properties.map((p) => ({
        id: p.house_id,
        title: p.title,
        address: p.address,
        position: {
          lat: parseFloat(String(p.lat)),
          lng: parseFloat(String(p.lng)),
        },
        price: {
          amount: p.rent_amount,
          currency: p.rent_currency,
          unit: p.lease_unit,
        },
        distance: p.school_info?.distance,
        image: p.updated_images?.[0] || null,
        room_type: p.room_types?.[0]?.name || "Room",
        amenities: p.amenities?.slice(0, 5) || [],
      })),
    };

    return res.status(200).json({
      success: true,
      data: mapData,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
exports.getAllUniversities = async (req, res) => {
  try {
    const universities = await Property.findAll({
      attributes: [
        [
          Sequelize.literal(
            "DISTINCT JSON_UNQUOTE(JSON_EXTRACT(school_info, '$.school_name'))"
          ),
          "school_name",
        ],
      ],
      where: {
        school_info: {
          [Op.ne]: null,
        },
      },
      raw: true,
    });

    const cleaned = universities
      .map((u) => u.school_name)
      .filter((u) => u !== null && u.trim() !== "");

    return res.status(200).json({
      success: true,
      count: cleaned.length,
      data: cleaned,
      message: "Universities fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching universities:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
exports.getTopCities = async (req, res) => {
  try {
    const topCities = await Property.findAll({
      attributes: [
        "city_name",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "propertyCount"],
        [Sequelize.fn("MIN", Sequelize.col("rent_amount")), "startingPrice"],
      ],
      where: {
        is_active: true,
        updated_images: { [Op.ne]: null },
      },
      group: ["city_name"],
      order: [[Sequelize.literal("propertyCount"), "DESC"]],
      limit: 6,
      raw: true,
    });

    let result = [];

    for (let i = 0; i < topCities.length; i++) {
      const city = topCities[i];

      const sampleProperty = await Property.findOne({
        where: { city_name: city.city_name },
        attributes: ["updated_images", "lat", "lng", "tags", "school_info"],
      });

      const img =
        sampleProperty?.updated_images?.length > 0
          ? sampleProperty.updated_images[0]
          : null;

      const universities = [];
      if (sampleProperty?.school_info?.school_name) {
        universities.push(sampleProperty.school_info.school_name);
      }

      const amenities = sampleProperty?.tags?.slice(0, 3).map((tag) => tag.name) || [];

      const formatted = {
        id: i + 1,
        name: city.city_name,
        country: "United Kingdom",
        flag: "🇬🇧",
        propertyCount: `${Number(city.propertyCount).toLocaleString()}+`,
        startingPrice: `£${Math.floor(city.startingPrice)}`,
        coordinates: {
          lat: sampleProperty.lat,
          lng: sampleProperty.lng,
        },
        universities: universities.length ? universities : ["University"],
        popular: true,
        amenities: amenities.length
          ? amenities
          : ["Near Underground", "Shopping Centers", "Cultural Spots"],
        image: img,
      };

      result.push(formatted);
    }

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.log("Error fetching top cities:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getTopRoomTypes = async (req, res) => {
  try {
    const properties = await Property.findAll({
      attributes: ["room_types", "updated_images"],

      where: {
        is_active: true,
        room_types: { [Op.ne]: null },

        // MUST have updated_images
        updated_images: { [Op.ne]: null },

        // MUST have at least 1 image
        [Op.and]: [
          Sequelize.where(Sequelize.fn("JSON_LENGTH", Sequelize.col("updated_images")), {
            [Op.gt]: 0,
          }),
        ],
      },

      raw: true,
    });

    // -------------------------------------------------
    // ROOM TYPE MAP (GROUP BY NAME)
    // -------------------------------------------------
    const roomTypeMap = {};

    properties.forEach((property) => {
      const roomTypes = Array.isArray(property.room_types) ? property.room_types : [];

      roomTypes.forEach((rt) => {
        const name = rt.name;
        if (!name) return;

        if (!roomTypeMap[name]) {
          roomTypeMap[name] = {
            id: Math.floor(Math.random() * 90000) + 10000,
            name,
            price: rt.price || null,
            currency: rt.currency || "GBP",
            leaseUnit: rt.lease_unit || "WEEK",
            description: getRoomTypeDescription(name),
            features: getRoomTypeFeatures(name),
            popular: true,
            available: 0,

            // SAFE: updated_images is guaranteed non-empty
            image: property.updated_images[0],
          };
        }

        // Count availability
        roomTypeMap[name].available += rt.count || 1;
      });
    });

    // Convert map to array & sort by availability (desc)
    const sortedRoomTypes = Object.values(roomTypeMap)
      .sort((a, b) => b.available - a.available)
      .slice(0, 4);

    return res.status(200).json({
      success: true,
      data: sortedRoomTypes,
      message: "Top room types retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching room types:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//
// Helper Functions
//
function getRoomTypeDescription(name) {
  const descriptions = {
    "En-suite": "Private room with ensuite bathroom",
    Studio: "Self-contained unit with private kitchen and bathroom",
    "Shared Room": "Shared living space with multiple beds",
    "Non En-suite": "Private room with shared bathroom",
  };
  return descriptions[name] || "Comfortable student accommodation option";
}

function getRoomTypeFeatures(name) {
  const features = {
    "En-suite": ["Private bathroom", "Study desk", "Wardrobe", "WiFi"],
    Studio: ["Private kitchen", "Private bathroom", "Desk", "Heating"],
    "Shared Room": ["Shared bathroom", "Shared kitchen", "WiFi", "Wardrobe"],
    "Non En-suite": ["Shared bathroom", "Desk", "WiFi", "Heating"],
  };
  return features[name] || ["WiFi", "Wardrobe", "Study desk"];
}

exports.syncPropertiesToFrontendTable = async (req, res) => {
  try {
    console.log("Raw properties fetched from new_table:");
    // Get raw data from new_table
    const rawProperties = await newTableModel.findAll();

    console.log("Raw properties fetched from new_table:", rawProperties.length);

    // Transform data for frontend
    const transformedData = transformPropertyData(rawProperties);

    if (transformedData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No properties found to sync",
      });
    }

    // Clear existing data and insert new data
    await Property.destroy({ where: {} });

    // Bulk insert transformed data
    await Property.bulkCreate(transformedData, {
      updateOnDuplicate: Object.keys(Property.rawAttributes).filter(
        (key) => key !== "id"
      ),
    });

    return res.status(200).json({
      success: true,
      message: `Successfully synced ${transformedData.length} properties`,
      count: transformedData.length,
    });
  } catch (error) {
    console.error("Error syncing properties:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during sync",
    });
  }
};

exports.syncOnePropertieInDatabase = async (req, res) => {
  try {
    // const test = require("../../../data/NewPropertiesCountryWiseData/uk/Already-Exist/sheffield.json");
    const filePath = path.join(
      __dirname
      // "../../../data/NewPropertiesCountryWiseData/uk/Already-Exist/sheffield.json"
    );
    const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Transform data for frontend
    const transformedData = transformPropertyData(fileData);
    // const transformedData = NewtransformPropertyData(fileData);
    console.log("transformedData", transformedData);

    if (transformedData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No properties found to sync",
      });
    }
    console.log(`Total items in JSON: ${transformedData.length}`);

    // Step 1: Fetch existing house_ids from DB
    const existing = await Property.findAll({
      attributes: ["house_id"],
      raw: true,
    });

    const existingIds = new Set(existing.map((x) => x.house_id));
    console.log(`Already in DB: ${existingIds.size}`);

    //Step 2: Filter new data (remove duplicates)
    const newData = transformedData.filter((item) => !existingIds.has(item.house_id));
    console.log(`New items to insert: ${newData.length}`);

    if (newData.length === 0) {
      return res.status(200).json({
        success: true,
        message: "All data already synced. No new properties found.",
      });
    }

    const chunkSize = 150;
    let inserted = 0;

    // return res.send("okk");

    const transaction = await sequelize.transaction();

    try {
      for (let i = 0; i < transformedData.length; i += chunkSize) {
        const chunk = transformedData.slice(i, i + chunkSize);

        await Property.bulkCreate(chunk, {
          updateOnDuplicate: Object.keys(Property.rawAttributes).filter(
            (key) => key !== "id"
          ),
          ignoreDuplicates: true,
          transaction: transaction,
        });

        inserted += chunk.length;
        console.log(`Inserted chunk ${i / chunkSize + 1}: ${chunk.length} records`);
      }
      await transaction.commit();
      console.log("Total inserted:", inserted);
    } catch (error) {
      await transaction.rollback();
      console.error("Transaction failed:", error);
      throw error;
    }

    console.log("inserted.length", inserted.length);

    return res.status(200).json({
      success: true,
      message: `Successfully synced ${inserted} properties`,
      count: inserted,
    });
  } catch (error) {
    console.error("Error syncing properties:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during sync",
    });
  }
};

// exports.syncManyPropertiesInDatabase = async (req, res) => {
//   try {
//     // cosnt data = require("../../../data/NewPropertiesCountryWiseData/uk");
//     const folderPath = path.join(
//       __dirname,
//       "../../../data/NewPropertiesCountryWiseData/uk"
//     );
//     const files = fs.readdirSync(folderPath);
//     console.log(`Found ${files.length} files. Starting import...\n`);
//     let totalInserted = 0;
//     for (const file of files) {
//       if (!file.endsWith(".json")) continue;
//       const filePath = path.join(folderPath, file);
//       console.log(`Processing File: ${file}`);
//       const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
//       console.log("jsonData", jsonData);
//       if (!Array.isArray(jsonData)) {
//         console.log(`Skipping ${file}, JSON is not an array.`);
//         continue;
//       }
//       // ✅ Transform ALL records at once
//       // const transformedData = jsonData
//       //   .map((record) => transformPropertyData(record))
//       //   .filter((item) => item);

//       // const transformedData = transformPropertyData(jsonData);
//       const transformedData = transformPropertyData(jsonData).filter(
//         (item) =>
//           item && typeof item === "object" && !Array.isArray(item) && item.house_id
//       );
//       if (transformedData.length === 0) {
//         console.log(`No valid properties in ${file}`);
//         continue;
//       }
//       console.log(`Total items in transformed JSON: ${transformedData.length}`);
//       // ✅ Get all existing house_ids once per file
//       const existing = await Property.findAll({
//         attributes: ["house_id"],
//         raw: true,
//       });
//       const existingIds = new Set(existing.map((x) => x.house_id));
//       console.log(`Already in DB: ${existingIds.size}`);
//       // ✅ Filter only new items
//       const newData = transformedData.filter((item) => !existingIds.has(item.house_id));
//       if (newData.length === 0) {
//         console.log(`All items already synced for ${file}`);
//         continue;
//       }

//       console.log(`New items to insert: ${newData.length}`);
//       const chunkSize = 150;
//       const transaction = await sequelize.transaction();
//       let insertedCount = 0;
//       try {
//         for (let i = 0; i < newData.length; i += chunkSize) {
//           const chunk = newData.slice(i, i + chunkSize);
//           await Property.bulkCreate(chunk, {
//             ignoreDuplicates: true,
//             transaction: transaction,
//           });
//           insertedCount += chunk.length;
//           console.log(`Inserted chunk #${i / chunkSize + 1}: ${chunk.length}`);
//         }
//         await transaction.commit();
//         console.log(`✔ ${file} Completed. Inserted: ${insertedCount}\n`);
//         totalInserted += insertedCount;
//       } catch (error) {
//         await transaction.rollback();
//         console.error("Transaction failed for file:", file, error);
//         continue;
//       }
//     }
//     return res.status(200).json({
//       success: true,
//       message: `Sync completed`,
//       totalInserted,
//     });
//   } catch (error) {
//     console.error("Error syncing properties:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Internal server error during sync",
//     });
//   }
// };

exports.syncManyPropertiesInDatabase = async (req, res) => {
  // Insert Properties list data in database
  try {
    // const test = require("../../../data/NewPropertiesCountryWiseData/ae/Properties-ListData-AE"
    const folderPath = path.join(
      __dirname
      // "../../../data/NewPropertiesCountryWiseData/uk/Already-Exist"
    );

    const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".json"));
    console.log(`Found ${files.length} JSON files. Starting import...\n`);

    // 🔹 Global counters
    let totalJsonRecords = 0;
    let totalValidRecords = 0;
    let totalInserted = 0;
    let totalSkipped = 0;

    const insertedHouseIds = [];
    const skippedHouseIds = [];

    // 🔹 Fetch existing house_ids ONCE
    const existing = await Property.findAll({
      attributes: ["house_id"],
      raw: true,
    });
    const existingIds = new Set(existing.map((x) => x.house_id));
    console.log(`Already in DB before sync: ${existingIds.size}`);

    const fileWiseSummary = [];

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      console.log(`\nProcessing File: ${file}`);

      const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      if (!Array.isArray(jsonData)) {
        console.log(`Skipping ${file}, JSON is not an array.`);
        continue;
      }

      totalJsonRecords += jsonData.length;

      // 🔹 Transform data
      const transformedData = transformPropertyData(jsonData).filter(
        (item) =>
          item && typeof item === "object" && !Array.isArray(item) && item.house_id
      );

      totalValidRecords += transformedData.length;

      if (transformedData.length === 0) {
        console.log(`No valid properties in ${file}`);
        continue;
      }

      // 🔹 Separate new vs existing
      const newData = [];
      let skippedInFile = 0;

      for (const item of transformedData) {
        if (existingIds.has(item.house_id)) {
          skippedInFile++;
          skippedHouseIds.push(item.house_id);
        } else {
          newData.push(item);
          existingIds.add(item.house_id); // prevent duplicates across files
        }
      }

      if (newData.length === 0) {
        console.log(`All items already exist for ${file}`);
        totalSkipped += skippedInFile;
        continue;
      }

      // 🔹 Insert in chunks
      const chunkSize = 150;
      const transaction = await sequelize.transaction();
      let insertedInFile = 0;

      try {
        for (let i = 0; i < newData.length; i += chunkSize) {
          const chunk = newData.slice(i, i + chunkSize);
          await Property.bulkCreate(chunk, {
            ignoreDuplicates: true,
            transaction,
          });

          insertedInFile += chunk.length;
          chunk.forEach((x) => insertedHouseIds.push(x.house_id));

          console.log(`Inserted chunk #${i / chunkSize + 1}: ${chunk.length}`);
        }

        await transaction.commit();

        totalInserted += insertedInFile;
        totalSkipped += skippedInFile;

        fileWiseSummary.push({
          file,
          totalJson: jsonData.length,
          validRecords: transformedData.length,
          inserted: insertedInFile,
          skipped: skippedInFile,
        });

        console.log(
          `✔ ${file} Completed. Inserted: ${insertedInFile}, Skipped: ${skippedInFile}`
        );
      } catch (error) {
        await transaction.rollback();
        console.error("Transaction failed for file:", file, error);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Sync completed successfully",
      summary: {
        totalFiles: files.length,
        totalJsonRecords,
        totalValidRecords,
        totalInserted,
        totalNotInserted: totalSkipped,
      },
      fileWiseSummary,
      // Uncomment if you want details
      // insertedHouseIds,
      // skippedHouseIds,
    });
  } catch (error) {
    console.error("Error syncing properties:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during sync",
    });
  }
};

exports.getUniversities = async (req, res) => {
  try {
    // Get distinct titles from properties that have school_info
    const universities = await Property.findAll({
      where: {
        is_active: true,
        school_info: {
          [Op.ne]: null,
        },
      },
      attributes: ["title"],
      group: ["title"],
      raw: true,
    });

    // Format results to get just the titles
    const universityList = universities
      .map((uni) => uni.title)
      .filter((title) => title !== null);

    return res.status(200).json({
      success: true,
      data: universityList,
      count: universityList.length,
      message: "List of universities fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching universities:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
// Get available cities for filter dropdown
exports.getAvailableCities = async (req, res) => {
  try {
    const cities = await Property.findAll({
      attributes: [
        "city_name",
        "country",
        [sequelize.fn("COUNT", sequelize.col("id")), "property_count"],
      ],
      where: { is_active: true },
      group: ["city_name", "country"],
      order: [["city_name", "ASC"]],
      raw: true,
    });

    // Extract only unique city_name strings
    const cityNames = cities
      .filter((item) => item.city_name && item.country)
      .map((item) => ({
        city_name: item.city_name,
        country: {
          country_name: item.country.country_name,
          country_unique_name: item.country.country_unique_name,
        },
        property_count: Number(item.property_count),
      }));

    return res.status(200).json({
      success: true,
      data: cityNames, // 👈 Return only city names
      message: "Cities retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// exports.getAvailableCities = async (req, res) => {
//   try {
//     const cities = await Property.findAll({
//       attributes: [
//         "city_name",
//         [sequelize.fn("COUNT", sequelize.col("id")), "property_count"],
//       ],
//       where: { is_active: true },
//       group: ["city_name"],
//       order: [["city_name", "ASC"]],
//       raw: true,
//     });

//     // Extract only unique city_name strings
//     const cityNames = cities
//       .filter((c) => c.city_name) // remove null
//       .map((c) => c.city_name); // keep only name

//     return res.status(200).json({
//       success: true,
//       data: cityNames, // 👈 Return only city names
//       message: "Cities retrieved successfully",
//     });
//   } catch (error) {
//     console.error("Error fetching cities:", error);
//     return res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

exports.getUniversitiesByCity = async (req, res) => {
  try {
    const { city, country } = req.query;

    if (!city) {
      return res.status(400).json({ success: false, message: "City name is required." });
    }

    const whereClause = { city_name: city };

    if (country) {
      whereClause.country_name = country;
    }

    const properties = await Property.findAll({
      where: whereClause,
      attributes: ["school_info"],
    });

    let universities = [];

    properties.forEach((p) => {
      let info = p.school_info;

      // If stored as string, parse it
      if (typeof info === "string") {
        try {
          info = JSON.parse(info);
        } catch (e) {}
      }

      if (info && info.school_name) {
        universities.push(info.school_name);
      }
    });

    // remove duplicates
    universities = [...new Set(universities)];

    return res.json({ success: true, data: universities });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get available suppliers for filter dropdown
exports.getAvailableSuppliers = async (req, res) => {
  try {
    const suppliers = await Property.findAll({
      attributes: [
        "supplier_name",
        [sequelize.fn("COUNT", sequelize.col("id")), "property_count"],
      ],
      where: {
        is_active: true,
        supplier_name: { [Op.ne]: null },
      },
      group: ["supplier_name"],
      order: [["supplier_name", "ASC"]],
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: suppliers,
      message: "Suppliers retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Get price range for filter slider
exports.getPriceRange = async (req, res) => {
  try {
    const priceRange = await Property.findOne({
      attributes: [
        [sequelize.fn("MIN", sequelize.col("rent_amount")), "min_price"],
        [sequelize.fn("MAX", sequelize.col("rent_amount")), "max_price"],
        [sequelize.fn("AVG", sequelize.col("rent_amount")), "avg_price"],
      ],
      where: {
        is_active: true,
        rent_amount: { [Op.gt]: 0 },
      },
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: {
        min_price: Math.floor(priceRange.min_price || 0),
        max_price: Math.ceil(priceRange.max_price || 1000),
        avg_price: Math.round(priceRange.avg_price || 0),
      },
      message: "Price range retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching price range:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Get available amenities for filter checkboxes
exports.getAvailableAmenities = async (req, res) => {
  try {
    const properties = await Property.findAll({
      attributes: ["amenities"],
      where: {
        is_active: true,
        amenities: { [Op.ne]: null },
      },
      raw: true,
    });

    // Extract and count all amenities
    const amenityCount = {};
    properties.forEach((property) => {
      if (property.amenities && Array.isArray(property.amenities)) {
        property.amenities.forEach((amenity) => {
          if (amenity && amenity.name) {
            amenityCount[amenity.name] = (amenityCount[amenity.name] || 0) + 1;
          }
        });
      }
    });

    // Convert to array and sort by frequency
    const amenities = Object.entries(amenityCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 most common amenities

    return res.status(200).json({
      success: true,
      data: amenities,
      message: "Amenities retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching amenities:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
exports.getAllPropertyTitles = async (req, res) => {
  try {
    const titles = await Property.findAll({
      attributes: [[sequelize.fn("DISTINCT", sequelize.col("title")), "title"]],
      where: { is_active: true },
      order: [["title", "ASC"]],
      raw: true,
    });

    // Extract plain title strings
    const propertyTitles = titles
      .map((t) => t.title)
      .filter((t) => t !== null && t !== "");

    return res.status(200).json({
      success: true,
      data: propertyTitles,
      message: "Property titles retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching property titles:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get properties statistics
exports.getPropertiesStats = async (req, res) => {
  try {
    const stats = await Property.findOne({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "total_properties"],
        [
          sequelize.fn("COUNT", sequelize.fn("DISTINCT", sequelize.col("city_name"))),
          "total_cities",
        ],
        [
          sequelize.fn("COUNT", sequelize.fn("DISTINCT", sequelize.col("supplier_name"))),
          "total_suppliers",
        ],
        [sequelize.fn("AVG", sequelize.col("rent_amount")), "avg_rent"],
        [sequelize.fn("SUM", sequelize.col("bed_num")), "total_beds"],
      ],
      where: { is_active: true },
      raw: true,
    });

    // Get top cities by property count
    const topCities = await Property.findAll({
      attributes: [
        "city_name",
        [sequelize.fn("COUNT", sequelize.col("id")), "property_count"],
      ],
      where: { is_active: true },
      group: ["city_name"],
      order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
      limit: 5,
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          total_properties: parseInt(stats.total_properties || 0),
          total_cities: parseInt(stats.total_cities || 0),
          total_suppliers: parseInt(stats.total_suppliers || 0),
          avg_rent: Math.round(stats.avg_rent || 0),
          total_beds: parseInt(stats.total_beds || 0),
        },
        top_cities: topCities,
      },
      message: "Statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// exports.getPropertyById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const property = await Property.findOne({
//       where: {
//         house_id: id,
//         is_active: true,
//         [Op.and]: [
//           { updated_images: { [Op.ne]: null } },
//           Sequelize.where(Sequelize.fn("JSON_LENGTH", Sequelize.col("updated_images")), {
//             [Op.gt]: 0,
//           }),
//         ],
//       },
//       attributes: {
//         exclude: ["images"], // Exclude images column from result
//       },
//     });

//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: "Property not found or missing updated_images",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: property,
//       message: "Property retrieved successfully",
//     });
//   } catch (error) {
//     console.error("Error fetching property:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Internal server error",
//     });
//   }
// };

exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findOne({
      where: {
        house_id: id,
        is_active: true,
        [Op.and]: [
          { updated_images: { [Op.ne]: null } },
          Sequelize.where(Sequelize.fn("JSON_LENGTH", Sequelize.col("updated_images")), {
            [Op.gt]: 0,
          }),
        ],
      },
      attributes: {
        exclude: ["images"],
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or missing updated_images",
      });
    }

    const MAX_IMAGES_PER_PROPERTY = 200;
    const CLOUD_PANEL_DOMAIN = "https://acolyteliving.startupflora.com";
    const BUCKET_DOMAIN = "https://storage.googleapis.com";

    // ✅ Process images directly (NO LOOP over property)
    if (property.updated_images && Array.isArray(property.updated_images)) {
      const finalUrls = [];

      for (let i = 0; i < property.updated_images.length; i++) {
        if (i >= MAX_IMAGES_PER_PROPERTY) break;

        const imageUrl = property.updated_images[i];

        try {
          // Case 1: Cloud panel images → NO signing
          if (imageUrl.startsWith(CLOUD_PANEL_DOMAIN)) {
            finalUrls.push(imageUrl);
            continue;
          }

          // Case 2: Bucket images → SIGN URL
          if (imageUrl.startsWith(BUCKET_DOMAIN)) {
            const objectKey = extractObjectKey(imageUrl);
            const presignedUrl = await getSignedImageUrl(objectKey);
            finalUrls.push(presignedUrl);
            continue;
          }

          // Fallback
          finalUrls.push(imageUrl);
        } catch (err) {
          console.error(`Failed to process image URL: ${imageUrl}`, err.message);
        }
      }

      property.updated_images = finalUrls;
    }

    return res.status(200).json({
      success: true,
      data: property,
      message: "Property retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching property:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.bulkUpdateImagesAll = async (req, res) => {
  try {
    const BATCH_SIZE = 50;
    let totalUpdated = 0;
    let processedCount = 0;

    const totalCount = await Property.count({
      where: {
        images: {
          [Op.ne]: null,
        },
      },
    });

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        message: "No properties with images found",
        updated_count: 0,
      });
    }

    console.log(`Starting bulk update for ${totalCount} properties...`);

    while (processedCount < totalCount) {
      const properties = await Property.findAll({
        where: {
          images: {
            [Op.ne]: null,
          },
        },
        limit: BATCH_SIZE,
        offset: processedCount,
        attributes: ["id", "images"],
        raw: true,
      });

      if (properties.length === 0) break;

      for (const property of properties) {
        try {
          const transformedImages = [];

          for (const imageUrl of property.images) {
            const match = imageUrl.match(/\/image\/(.+)$/);
            if (match) {
              let imagePath = match[1];
              imagePath = imagePath.replace(/_(g|h)\.webp$/, ".webp");
              const transformedPath = imagePath.replace(/\//g, "_");
              const newUrl = `https://acolyteliving.startupflora.com/new_images/image_${transformedPath}`;

              // Check if image URL exists
              try {
                const response = await axios.head(newUrl, { timeout: 2000 });
                if (response.status === 200) {
                  transformedImages.push(newUrl);
                } else {
                  console.warn(`Image not found (Status ${response.status}): ${newUrl}`);
                }
              } catch (err) {
                console.warn(
                  `Image unavailable: ${newUrl} (${err.response?.status || err.message})`
                );
              }
            } else {
              // Fallback to original image URL if not matched
              transformedImages.push(imageUrl);
            }
          }

          await Property.update(
            { updated_images: transformedImages },
            {
              where: { id: property.id },
              silent: true,
            }
          );

          totalUpdated++;
        } catch (updateError) {
          console.error(`Failed to update property ${property.id}:`, updateError.message);
        }
      }

      processedCount += properties.length;
      console.log(
        `Progress: ${processedCount}/${totalCount} (${Math.round(
          (processedCount / totalCount) * 100
        )}%)`
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return res.status(200).json({
      success: true,
      message: `Bulk update completed successfully`,
      total_properties: totalCount,
      updated_count: totalUpdated,
      skipped_count: totalCount - totalUpdated,
    });
  } catch (error) {
    console.error("Error bulk updating all images:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
};
exports.getAvailableRoomTypes = async (req, res) => {
  try {
    const properties = await Property.findAll({
      attributes: ["room_types"],
      where: { is_active: true },
      raw: true,
    });

    // Extract all names from room_types[]
    const roomTypeSet = new Set();

    properties.forEach((p) => {
      if (Array.isArray(p.room_types)) {
        p.room_types.forEach((rt) => {
          if (rt.name) {
            roomTypeSet.add(rt.name);
          }
        });
      }
    });

    // Convert Set → required format
    const formatted = [...roomTypeSet].map((type) => ({
      value: type.toLowerCase().replace(/\s+/g, "-"),
      label: type,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
      message: "Room types retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching room types:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
exports.globalSearchofProperty = async (req, res) => {
  try {
    const { keyword = "", page = 1, limit = 12 } = req.query;

    if (!keyword.trim()) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: Number(page),
      });
    }

    const offset = (page - 1) * limit;

    // ----------------------------------------------------
    // SEARCH CONDITIONS
    // ----------------------------------------------------
    const searchCondition = {
      is_active: true,
      [Op.or]: [
        { title: { [Op.like]: `%${keyword}%` } },
        { address: { [Op.like]: `%${keyword}%` } },
        { city_name: { [Op.like]: `%${keyword}%` } },
        sequelize.where(
          sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(school_info, '$.school_name'))"),
          {
            [Op.like]: `%${keyword}%`,
          }
        ),
      ],
    };

    // ----------------------------------------------------
    // PAGINATED RESULTS
    // ----------------------------------------------------
    const results = await Property.findAll({
      where: searchCondition,
      limit: Number(limit),
      offset: Number(offset),
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    // ----------------------------------------------------
    // TOTAL COUNT
    // ----------------------------------------------------
    const total = await Property.count({
      where: searchCondition,
    });

    return res.status(200).json({
      success: true,
      data: results,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error in global search:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
exports.getAllHouseId = async (req, res) => {
  try {
    const houseIds = await Property.findAll({
      attributes: ["house_id"],
      where: {
        is_active: true,
        // JSON_LENGTH(updated_images) > 0   (MySQL)
        [Op.and]: literal("JSON_LENGTH(updated_images) > 0"),
      },
      order: [["house_id", "ASC"]],
      raw: true,
    });

    // Extract only house_id values
    const houseIdData = houseIds.filter((c) => c.house_id).map((c) => c.house_id);

    return res.status(200).json({
      success: true,
      data: houseIdData,
      message: "House IDs with images retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching house IDs:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ------------------new code---------------------

const getBaseConditions = () => {
  return {
    is_active: true,
    // CRITICAL: We strictly require school_info to be present because
    // getTopUniversities aggregates by this field. If null, it shouldn't exist in either.
    // school_info: { [Op.ne]: null },
    [Op.and]: [
      { updated_images: { [Op.ne]: null } },
      // Use Sequelize.where for length check to be database agnostic (MySQL mostly)
      Sequelize.where(Sequelize.fn("JSON_LENGTH", Sequelize.col("updated_images")), {
        [Op.gt]: 0,
      }),
    ],
  };
};

exports.getAllProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Start with the strict base conditions
    const whereConditions = getBaseConditions();

    if (req.query.country_unique_name) {
      whereConditions[Op.and] = whereConditions[Op.and] || [];
      whereConditions[Op.and].push(
        Sequelize.where(
          jsonField("country", "country_unique_name"),
          req.query.country_unique_name
        )
      );
    }
    if (req.query.city_unique_name) {
      whereConditions[Op.and] = whereConditions[Op.and] || [];
      whereConditions[Op.and].push(
        Sequelize.where(jsonField("city", "city_unique_name"), req.query.city_unique_name)
      );
    }
    if (req.query.school_unique_name) {
      whereConditions[Op.and] = whereConditions[Op.and] || [];
      whereConditions[Op.and].push({
        [Op.or]: [
          Sequelize.where(
            jsonField("school_info", "school_name"),
            req.query.school_unique_name
          ),
        ],
      });
    }
    // --------------------------------------
    // GLOBAL SEARCH (title, city, school, address)
    // --------------------------------------
    if (req.query.search) {
      const search = String(req.query.search).trim().toLowerCase();

      whereConditions[Op.and] = whereConditions[Op.and] || [];

      const orFilters = [];

      // title
      orFilters.push(
        Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("title")), {
          [Op.like]: `%${search}%`,
        })
      );

      // city_name
      orFilters.push(
        Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("city_name")), {
          [Op.like]: `%${search}%`,
        })
      );

      // location.address (JSON)
      orFilters.push(
        Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("address")), {
          [Op.like]: `%${search}%`,
        })
      );

      // school_info.school_name (JSON)
      orFilters.push(
        Sequelize.where(
          Sequelize.fn(
            "LOWER",
            Sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(school_info, '$.school_name'))")
          ),
          { [Op.like]: `%${search}%` }
        )
      );

      // 👇 Attach OR group safely inside AND
      whereConditions[Op.and].push({ [Op.or]: orFilters });
    }

    // --------------------------------------
    // FILTER: UNIVERSITY NAME
    // --------------------------------------
    if (req.query.university) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];

      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(school_info, '$.school_name'))"),
          "=",
          req.query.university
        )
      );
    }

    // --------------------------------------
    // FILTER: PROPERTY TITLE
    // --------------------------------------
    if (req.query.title) {
      const title = req.query.title.trim().toLowerCase();

      whereConditions[Op.and] = whereConditions[Op.and] || [];
      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.fn("TRIM", Sequelize.col("title"))),
          { [Op.like]: `%${title}%` }
        )
      );
    }

    // // --------------------------------------
    // // FILTER: CITY
    // // --------------------------------------
    // if (req.query.city) {
    //   whereConditions.city_name = { [Op.like]: `%${req.query.city}%` };
    // }
    // --------------------------------------
    // FILTER: CITY
    // --------------------------------------
    // if (req.query.city) {
    //   whereConditions.city_name = { [Op.like]: `%${req.query.city}%` };
    // }
    if (req.query.city) {
      whereConditions.city_name = { [Op.like]: `%${req.query.city}%` };
    } else if (req.query.country) {
      const cc = String(req.query.country).toLowerCase().trim();
      const cities = (countryCityMap[cc] || [])
        .map((c) =>
          String(c || "")
            .toLowerCase()
            .trim()
        )
        .filter((c) => c.length >= 2);

      if (!cities.length) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { current_page: page, total: 0, total_pages: 0 },
          filters_applied: req.query,
        });
      }

      const cityOrConditions = cities.flatMap((slug) => {
        const spaced = slug.replace(/-/g, " ");
        const conds = [
          Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("city_name")), {
            [Op.like]: `%${slug}%`,
          }),
        ];
        if (spaced !== slug) {
          conds.push(
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("city_name")), {
              [Op.like]: `%${spaced}%`,
            })
          );
        }
        return conds;
      });

      whereConditions[Op.and] = whereConditions[Op.and] || [];

      // ✅ This guarantees Sequelize generates a real OR group in SQL
      whereConditions[Op.and].push(Sequelize.or(...cityOrConditions));
    }

    // --------------------------------------
    // FILTER: ROOM TYPE
    // --------------------------------------
    if (req.query.room_type) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      whereConditions[Op.and].push(
        Sequelize.literal(
          `JSON_SEARCH(room_types, 'one', '${req.query.room_type}', NULL, '$[*].name') IS NOT NULL`
        )
      );
    }

    // --------------------------------------
    // FILTER: AMENITIES (Precise JSON Path)
    // --------------------------------------
    if (req.query.amenities) {
      const amenitiesArr = req.query.amenities.split(",");
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];

      // FIX: Targeted path '$[*].name' ensures we don't match description text by accident
      const amenityConditions = amenitiesArr.map((a) =>
        Sequelize.literal(
          `JSON_SEARCH(amenities, 'one', '${a}', NULL, '$[*].name') IS NOT NULL`
        )
      );

      whereConditions[Op.and].push({ [Op.or]: amenityConditions });
    }

    // --------------------------------------
    // PRICE FILTER
    // --------------------------------------
    if (req.query.min_price || req.query.max_price) {
      whereConditions.rent_amount = {};
      if (req.query.min_price)
        whereConditions.rent_amount[Op.gte] = parseFloat(req.query.min_price);
      if (req.query.max_price)
        whereConditions.rent_amount[Op.lte] = parseFloat(req.query.max_price);
    }

    // --------------------------------------
    // SUPPLIER
    // --------------------------------------
    if (req.query.supplier) {
      whereConditions.supplier_name = { [Op.like]: `%${req.query.supplier}%` };
    }

    // --------------------------------------
    // BOOKING STATUS
    // --------------------------------------
    if (req.query.booking_status) {
      whereConditions.booking_status = parseInt(req.query.booking_status);
    }

    // --------------------------------------
    // COUNT TOTAL RESULTS
    // --------------------------------------
    const totalCount = await Property.count({ where: whereConditions });

    // --------------------------------------
    // SORTING LOGIC
    // --------------------------------------
    const prioritySuppliers = [
      "Urbanest",
      "Vita Student",
      "iQ Student Accommodation",
      "Uniplaces",
      "GoBritanya",
      "Kexgill",
      "Student Luxe",
      "Student FM",
      "Student Roost",
      "Londonist DMC",
      "UniAcco",
    ];

    const priorityCaseStatement = prioritySuppliers
      .map((supplier, index) => `WHEN supplier_name = '${supplier}' THEN ${index + 1}`)
      .join(" ");

    // const orderClause = [
    //   Sequelize.literal(
    //     `CASE ${priorityCaseStatement} ELSE ${prioritySuppliers.length + 1} END ASC`
    //   ),
    // ];

    const orderClause = [
      [
        Sequelize.literal(
          `CASE ${priorityCaseStatement} ELSE ${prioritySuppliers.length + 1} END`
        ),
        "ASC",
      ],
      ["id", "ASC"],
    ];

    if (req.query.sort === "low_to_high") {
      orderClause.push(["rent_amount", "ASC"]);
    } else if (req.query.sort === "high_to_low") {
      orderClause.push(["rent_amount", "DESC"]);
    } else {
      orderClause.push(literal("RAND()"));
    }

    // --------------------------------------

    // EXECUTE QUERY
    // --------------------------------------
    const properties = await Property.findAll({
      where: whereConditions,
      order: orderClause,
      limit,
      offset,
      attributes: { exclude: ["updatedAt", "images"] },
    });

    const MAX_IMAGES_PER_PROPERTY = 10;
    const CLOUD_PANEL_DOMAIN = "https://acolyteliving.startupflora.com";
    const BUCKET_DOMAIN = "https://storage.googleapis.com";

    // Generate URLs for images (signed only for bucket images)
    for (const property of properties) {
      if (property.updated_images && Array.isArray(property.updated_images)) {
        const finalUrls = [];

        for (let i = 0; i < property.updated_images.length; i++) {
          if (i >= MAX_IMAGES_PER_PROPERTY) break;

          const imageUrl = property.updated_images[i];

          try {
            //Case 1: Cloud panel images → NO signing
            if (imageUrl.startsWith(CLOUD_PANEL_DOMAIN)) {
              finalUrls.push(imageUrl);
              continue;
            }

            // Case 2: Bucket images → SIGN URL
            if (imageUrl.startsWith(BUCKET_DOMAIN)) {
              const objectKey = extractObjectKey(imageUrl);
              const presignedUrl = await getSignedImageUrl(objectKey);
              finalUrls.push(presignedUrl);
              continue;
            }

            // Unknown source (fallback)
            finalUrls.push(imageUrl);
          } catch (err) {
            console.error(`Failed to process image URL: ${imageUrl}`, err.message);
          }
        }

        property.updated_images = finalUrls;
      }
    }

    // // Generate presigned URLs for images
    // for (const property of properties) {
    //   if (property.updated_images && Array.isArray(property.updated_images)) {
    //     const presignedUrls = [];
    //     for (let i = 0; i < property.updated_images.length; i++) {
    //       if (i >= MAX_IMAGES_PER_PROPERTY) break;
    //       const imageUrl = property.updated_images[i];

    //       const objectKey = extractObjectKey(imageUrl);
    //       try {
    //         const presignedUrl = await getSignedImageUrl(objectKey);
    //         presignedUrls.push(presignedUrl);
    //       } catch (err) {
    //         console.error(
    //           `Failed to generate presigned URL for image: ${imageUrl}`,
    //           err.message
    //         );
    //       }
    //     }
    //     property.updated_images = presignedUrls;
    //   }
    // }

    return res.status(200).json({
      success: true,
      pagination: {
        current_page: page,
        total: totalCount,
        total_pages: Math.ceil(totalCount / limit),
      },
      filters_applied: req.query,
      data: properties,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.getTopUniversities = async (req, res) => {
  try {
    // 1. Fetch raw data using the EXACT SAME base conditions as getAllProperties
    // This ensures the pool of candidates is identical.
    const properties = await Property.findAll({
      attributes: [
        [
          Sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(school_info, '$.school_name'))"),
          "university_name",
        ],
        [
          Sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(school_info, '$.location.lat'))"),
          "lat",
        ],
        [
          Sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(school_info, '$.location.lng'))"),
          "lng",
        ],
        "city_name",
        "updated_images",
      ],
      where: getBaseConditions(), // Reusing the shared function
      raw: true,
    });

    // 2. Perform Aggregation in Memory (as per your original logic)
    const uniMap = {};

    properties.forEach((p) => {
      const name = p.university_name;

      // Mirror the strict equality check: if the name is invalid, we skip it.
      // This implies that in getAllProperties, we must not match null/empty strings.
      if (!name || name === "null" || name.trim() === "") return;

      if (!uniMap[name]) {
        uniMap[name] = {
          name,
          city: p.city_name,
          propertyCount: 0,
          image: p.updated_images?.[0] || null,
          coordinates: { lat: parseFloat(p.lat), lng: parseFloat(p.lng) },
        };
      }
      uniMap[name].propertyCount += 1;
    });

    const sortedUniversities = Object.values(uniMap)
      .sort((a, b) => b.propertyCount - a.propertyCount)
      .slice(0, 6);

    return res.status(200).json({
      success: true,
      data: sortedUniversities,
    });
  } catch (error) {
    console.error("Error fetching universities:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
// ----------------new code-------------------------

exports.getPresignedUrlProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Start with the strict base conditions
    const whereConditions = getBaseConditions();

    if (req.query.country_unique_name) {
      whereConditions[Op.and] = whereConditions[Op.and] || [];
      whereConditions[Op.and].push(
        Sequelize.where(
          jsonField("country", "country_unique_name"),
          req.query.country_unique_name
        )
      );
    }
    if (req.query.city_unique_name) {
      whereConditions[Op.and] = whereConditions[Op.and] || [];
      whereConditions[Op.and].push(
        Sequelize.where(jsonField("city", "city_unique_name"), req.query.city_unique_name)
      );
    }
    if (req.query.school_unique_name) {
      whereConditions[Op.and] = whereConditions[Op.and] || [];
      whereConditions[Op.and].push({
        [Op.or]: [
          Sequelize.where(
            jsonField("school_info", "school_name"),
            req.query.school_unique_name
          ),
        ],
      });
    }

    // --------------------------------------
    // GLOBAL SEARCH (title, city, school, address)
    // --------------------------------------
    if (req.query.search) {
      const search = String(req.query.search).trim().toLowerCase();

      whereConditions[Op.and] = whereConditions[Op.and] || [];

      const orFilters = [];

      // title
      orFilters.push(
        Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("title")), {
          [Op.like]: `%${search}%`,
        })
      );

      // city_name
      orFilters.push(
        Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("city_name")), {
          [Op.like]: `%${search}%`,
        })
      );

      // location.address (JSON)
      orFilters.push(
        Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("address")), {
          [Op.like]: `%${search}%`,
        })
      );

      // school_info.school_name (JSON)
      orFilters.push(
        Sequelize.where(
          Sequelize.fn(
            "LOWER",
            Sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(school_info, '$.school_name'))")
          ),
          { [Op.like]: `%${search}%` }
        )
      );

      // 👇 Attach OR group safely inside AND
      whereConditions[Op.and].push({ [Op.or]: orFilters });
    }

    // --------------------------------------
    // FILTER: UNIVERSITY NAME
    // --------------------------------------
    if (req.query.university) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];

      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(school_info, '$.school_name'))"),
          "=",
          req.query.university
        )
      );
    }

    // --------------------------------------
    // FILTER: PROPERTY TITLE
    // --------------------------------------
    if (req.query.title) {
      const title = req.query.title.trim().toLowerCase();

      whereConditions[Op.and] = whereConditions[Op.and] || [];
      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.fn("TRIM", Sequelize.col("title"))),
          { [Op.like]: `%${title}%` }
        )
      );
    }

    // --------------------------------------
    // FILTER: CITY
    // --------------------------------------
    // if (req.query.city) {
    //   whereConditions.city_name = { [Op.like]: `%${req.query.city}%` };
    // }
    if (req.query.city) {
      whereConditions.city_name = { [Op.like]: `%${req.query.city}%` };
    } else if (req.query.country) {
      const cc = String(req.query.country).toLowerCase().trim();
      const cities = (countryCityMap[cc] || [])
        .map((c) =>
          String(c || "")
            .toLowerCase()
            .trim()
        )
        .filter((c) => c.length >= 2);

      if (!cities.length) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { current_page: page, total: 0, total_pages: 0 },
          filters_applied: req.query,
        });
      }

      const cityOrConditions = cities.flatMap((slug) => {
        const spaced = slug.replace(/-/g, " ");
        const conds = [
          Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("city_name")), {
            [Op.like]: `%${slug}%`,
          }),
        ];
        if (spaced !== slug) {
          conds.push(
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("city_name")), {
              [Op.like]: `%${spaced}%`,
            })
          );
        }
        return conds;
      });

      whereConditions[Op.and] = whereConditions[Op.and] || [];

      // ✅ This guarantees Sequelize generates a real OR group in SQL
      whereConditions[Op.and].push(Sequelize.or(...cityOrConditions));
    }

    // --------------------------------------
    // FILTER: ROOM TYPE
    // --------------------------------------
    if (req.query.room_type) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      whereConditions[Op.and].push(
        Sequelize.literal(
          `JSON_SEARCH(room_types, 'one', '${req.query.room_type}', NULL, '$[*].name') IS NOT NULL`
        )
      );
    }

    // --------------------------------------
    // FILTER: AMENITIES (Precise JSON Path)
    // --------------------------------------
    if (req.query.amenities) {
      const amenitiesArr = req.query.amenities.split(",");
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];

      // FIX: Targeted path '$[*].name' ensures we don't match description text by accident
      const amenityConditions = amenitiesArr.map((a) =>
        Sequelize.literal(
          `JSON_SEARCH(amenities, 'one', '${a}', NULL, '$[*].name') IS NOT NULL`
        )
      );

      whereConditions[Op.and].push({ [Op.or]: amenityConditions });
    }

    // --------------------------------------
    // PRICE FILTER
    // --------------------------------------
    if (req.query.min_price || req.query.max_price) {
      whereConditions.rent_amount = {};
      if (req.query.min_price)
        whereConditions.rent_amount[Op.gte] = parseFloat(req.query.min_price);
      if (req.query.max_price)
        whereConditions.rent_amount[Op.lte] = parseFloat(req.query.max_price);
    }

    // --------------------------------------
    // SUPPLIER
    // --------------------------------------
    if (req.query.supplier) {
      whereConditions.supplier_name = { [Op.like]: `%${req.query.supplier}%` };
    }

    // --------------------------------------
    // BOOKING STATUS
    // --------------------------------------
    if (req.query.booking_status) {
      whereConditions.booking_status = parseInt(req.query.booking_status);
    }

    // --------------------------------------
    // COUNT TOTAL RESULTS
    // --------------------------------------
    const totalCount = await Property.count({ where: whereConditions });

    // --------------------------------------
    // SORTING LOGIC
    // --------------------------------------
    const prioritySuppliers = [
      "Urbanest",
      "Vita Student",
      "iQ Student Accommodation",
      "Uniplaces",
      "GoBritanya",
      "Kexgill",
      "Student Luxe",
      "Student FM",
      "Student Roost",
      "Londonist DMC",
      "UniAcco",
    ];

    const priorityCaseStatement = prioritySuppliers
      .map((supplier, index) => `WHEN supplier_name = '${supplier}' THEN ${index + 1}`)
      .join(" ");

    // const orderClause = [
    //   Sequelize.literal(
    //     `CASE ${priorityCaseStatement} ELSE ${prioritySuppliers.length + 1} END ASC`
    //   ),
    // ];

    const orderClause = [
      [
        Sequelize.literal(
          `CASE ${priorityCaseStatement} ELSE ${prioritySuppliers.length + 1} END`
        ),
        "ASC",
      ],
      ["id", "ASC"],
    ];

    if (req.query.sort === "low_to_high") {
      orderClause.push(["rent_amount", "ASC"]);
    } else if (req.query.sort === "high_to_low") {
      orderClause.push(["rent_amount", "DESC"]);
    } else {
      orderClause.push(literal("RAND()"));
    }

    // --------------------------------------

    const properties = await Property.findAll({
      where: whereConditions,
      order: orderClause,
      limit,
      offset,
      attributes: { exclude: ["updatedAt", "images"] },
    });

    const MAX_IMAGES_PER_PROPERTY = 10;
    const CLOUD_PANEL_DOMAIN = "https://acolyteliving.startupflora.com";
    const BUCKET_DOMAIN = "https://storage.googleapis.com";

    // Generate URLs for images (signed only for bucket images)
    for (const property of properties) {
      if (property.updated_images && Array.isArray(property.updated_images)) {
        const finalUrls = [];

        for (let i = 0; i < property.updated_images.length; i++) {
          if (i >= MAX_IMAGES_PER_PROPERTY) break;

          const imageUrl = property.updated_images[i];

          try {
            //Case 1: Cloud panel images → NO signing
            if (imageUrl.startsWith(CLOUD_PANEL_DOMAIN)) {
              finalUrls.push(imageUrl);
              continue;
            }

            // Case 2: Bucket images → SIGN URL
            if (imageUrl.startsWith(BUCKET_DOMAIN)) {
              const objectKey = extractObjectKey(imageUrl);
              const presignedUrl = await getSignedImageUrl(objectKey);
              if (!presignedUrl) continue;
              finalUrls.push(presignedUrl);
              continue;
            }

            // Unknown source (fallback)
            finalUrls.push(imageUrl);
          } catch (err) {
            console.error(`Failed to process image URL: ${imageUrl}`, err.message);
          }
        }

        property.updated_images = finalUrls;
      }
    }

    // // Generate presigned URLs for images
    // for (const property of properties) {
    //   if (property.updated_images && Array.isArray(property.updated_images)) {
    //     const presignedUrls = [];
    //     for (let i = 0; i < property.updated_images.length; i++) {
    //       if (i >= MAX_IMAGES_PER_PROPERTY) break;
    //       const imageUrl = property.updated_images[i];

    //       const objectKey = extractObjectKey(imageUrl);
    //       try {
    //         const presignedUrl = await getSignedImageUrl(objectKey);
    //         presignedUrls.push(presignedUrl);
    //       } catch (err) {
    //         console.error(
    //           `Failed to generate presigned URL for image: ${imageUrl}`,
    //           err.message
    //         );
    //       }
    //     }
    //     property.updated_images = presignedUrls;
    //   }
    // }

    return res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        current_page: page,
        total: totalCount,
        total_pages: Math.ceil(totalCount / limit),
      },
      filters_applied: req.query,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// const BASE_URL = "https://acolyteliving.startupflora.com/new_images";
const BASE_URL_2 = "https://storage.googleapis.com/acolyte-living-img/new_images";
// compare images in Properties Table with filter images and insert matched images in updated_images column for only one city
exports.compareImageswithPropertyTable = async (req, res) => {
  try {
    // const temps = await TempImage.findAll();
    // const test = require("../../../data/26 nov-2025 london/1-10855");
    // const filepath = path.join(__dirname, "../../../data/london-2");

    const files = fs.readdirSync(filepath).filter((file) => {
      return fs.lstatSync(path.join(filepath, file)).isFile();
    });

    tempMap = {};
    // files.forEach((t) => {
    //   // const clean = t.replace(".webp", "").replace(/_/g, "/");
    //   const clean = t
    //     .replace(".webp", "")
    //     .replace(".png", "")
    //     .replace(".jpg", "")
    //     .replace(".jpeg", "")
    //     .replace(/_[a-zA-Z0-9]+$/, "")
    //     .split("_")[0];
    //   const key = clean.split("/").pop().split("_")[0];
    //   tempMap[key] = t;
    // });
    // console.log("files", files);

    // files.forEach((file) => {
    //   const key = file.match(/_([A-Z0-9]+)\.(webp|png|jpg|jpeg)$/i)?.[1];
    //   if (key) {
    //     tempMap[key] = `${file}`;
    //   }
    // });

    // const tempMap = {};

    files.forEach((file) => {
      const match = file.match(/([A-Z0-9]{26})\.(webp|png|jpg|jpeg)$/i);
      if (match) {
        const key = match[1]; // ULID
        tempMap[key] = file;
      }
    });

    // console.log("tempMap", tempMap);
    console.log("tempMap", Object.keys(tempMap).length);
    // return res.send("okkk");

    // console.log("tempMap", tempMap);

    // const properties = await Property.findAll();
    // if (!properties || properties.length === 0) {
    //   return res.status(404).json({ message: "No Property Data Found" });
    // }
    const properties = await Property.findAll({
      where: {
        city_name: "London",
      },
    });
    if (!properties || properties.length === 0) {
      return res.status(404).json({ message: "No Property Data Found" });
    }

    // console.log("tempMap", tempMap);
    // console.log("properties", properties.length);
    // console.log("total", files.length);
    // return res.send("okk");

    let matchCount = 0;
    const matchedImages = [];
    const unmatchedPropertiesImages = [];
    const matchedKeys = new Set();

    // for (const property of properties) {
    //   const house_id = property.dataValues.house_id;
    //   const mediaImages = property.dataValues.images;
    //   if (!mediaImages || mediaImages.length === 0) continue;
    //   for (const url of mediaImages) {
    //     const pathname = new URL(url).pathname;
    //     const fileName = pathname.split("/").pop();
    //     const cleanFileName = fileName
    //       .replace(".webp", "")
    //       .replace(".png", "")
    //       .replace(".jpg", "")
    //       .replace(".jpeg", "")
    //       .replace(/_[a-zA-Z0-9]+$/, "")
    //       .replace("_g", "");
    //     const isMatch = tempMap[cleanFileName];
    //     if (isMatch) {
    //       const mediaValue = tempMap[`${cleanFileName}.webp`];
    //       matchedImages.push({
    //         house_id,
    //         media_url: mediaValue,
    //       });
    //       matchCount++;
    //       matchedKeys.add(fileName);
    //     } else {
    //       unmatchedPropertiesImages.push({
    //         house_id,
    //         missing_file: fileName,
    //         expected_key: pathname,
    //         original_url: url,
    //       });
    //     }
    //   }
    // }

    for (const property of properties) {
      const house_id = property.house_id;
      const mediaImages = property.images;
      if (!Array.isArray(mediaImages)) continue;

      const totalImages = mediaImages.length;
      for (const url of mediaImages) {
        const pathname = new URL(url).pathname;
        const fileName = pathname.split("/").pop();
        const cleanFileName = fileName
          .replace(/\.(webp|png|jpg|jpeg)$/i, "")
          .replace(/_[a-zA-Z0-9]+$/, "")
          .replace("_g", "");
        // const cleanFileName = fileName.match(/[A-Z0-9]{26}/i)?.[0];
        const matchedFile = tempMap[cleanFileName];
        if (matchedFile) {
          matchedImages.push({
            house_id,
            media_url: matchedFile,
          });
          matchedKeys.add(cleanFileName);
          matchCount++;
        } else {
          unmatchedPropertiesImages.push({
            house_id,
            missing_file: fileName,
            original_url: url,
          });
        }
      }
    }

    const unmatchedTemp = [];
    for (const key in tempMap) {
      if (!matchedKeys.has(key)) {
        const value = tempMap[key];
        unmatchedTemp.push(value?.raw || value);
      }
    }

    if (matchedImages.length === 0) {
      return res.status(400).json({
        message: "No media_images found across all Properties.",
      });
    }

    console.log("matchedImages", matchedImages.length);
    return res.send("okk");

    const groupByHouse = matchedImages.reduce((acc, item) => {
      if (!acc[item.house_id]) acc[item.house_id] = [];
      acc[item.house_id].push(`${BASE_URL_2}/${item.media_url}`);
      return acc;
    }, {});

    for (const houseId of Object.keys(groupByHouse)) {
      await Property.update(
        { updated_images: groupByHouse[houseId] },
        { where: { house_id: houseId } }
      );
    }

    // Group matched by house
    // const groupByHouse = matchedImages.reduce((acc, item) => {
    //   if (!acc[item.house_id]) acc[item.house_id] = [];
    //   acc[item.house_id].push(item.media_url);
    //   return acc;
    // }, {});
    // const houseIds = Object.keys(groupByHouse);
    // for (const houseId of houseIds) {
    //   // Fetch property row
    //   const property = await Property.findOne({
    //     where: { house_id: houseId },
    //   });

    //   if (!property) {
    //     console.log(`Property not found for house_id: ${houseId}`);
    //     continue;
    //   }

    //   // Filter: Keep only those that match matchedImages list
    //   const allowedFiles = groupByHouse[houseId].map((s) => s);

    //   const filteredImages = allowedFiles.map((imgObj) => {
    //     return `${BASE_URL_2}/${imgObj}`;
    //   });

    //   // Save into DB
    //   property.set("updated_images", filteredImages);
    //   await property.save();
    // }

    res.status(200).json({
      TotalFilter: files.length,
      message: `Successfully Inserted ${matchedImages.length}.`,
      insertedCount: matchedImages.length,
      matchedCount: matchedImages.length,
      ImagesUnmatched: unmatchedPropertiesImages.length,
      unmatchedTempImagesCount: unmatchedTemp.length,
      Imagesunmatched: unmatchedPropertiesImages,
      unmatchedTempImages: unmatchedTemp,
    });
  } catch (error) {
    console.error("Error inserting all house media:", error);
    res.status(500).json({ message: "Internal server error - in -" });
  }
};

// const BASE_URL_2 = "https://storage.googleapis.com/acolyte-living-img/new_images";
// exports.compareImageswithPropertyTable = async (req, res) => {
//   try {
//     const BASE_DIR = path.join(
//       __dirname,
//       "../../../data/NewPropertiesCountryWiseData/uk/Properties-Images-uk"
//     );
//     // const test = require("../../../data/NewPropertiesCountryWiseData/uk/Properties-Images-uk");

//     const cityFolders = fs
//       .readdirSync(BASE_DIR)
//       .filter((f) => fs.lstatSync(path.join(BASE_DIR, f)).isDirectory());

//     if (!cityFolders.length) {
//       return res.status(404).json({ message: "No city folders found" });
//     }

//     const result = {};

//     for (const city of cityFolders) {
//       console.log("city", city);
//       const cityPath = path.join(BASE_DIR, city);

//       const files = fs
//         .readdirSync(cityPath)
//         .filter((file) => fs.lstatSync(path.join(cityPath, file)).isFile());

//       // console.log(`Files in ${city}:`, files.length);

//       const imageMap = {};

//       files.forEach((fileName) => {
//         const cleanName = fileName
//           .replace(/\.(webp|png|jpg|jpeg)$/i, "")
//           .replace(/_[a-zA-Z0-9]+$/, "")
//           .replace(/_g$/, "");

//         const key = cleanName.split("_")[0]; // property id or main key
//         imageMap[key] = cleanName;
//       });

//       // console.log("imageMap", imageMap);

//       result[city] = imageMap; // save per city
//     }

//     console.log("imageMap", Object.keys(result).length);

//     // for (const city of cityFolders) {
//     //   console.log("city", city);
//     //   const cityPath = path.join(BASE_DIR, city);
//     //   console.log("city", cityPath);

//     //   const files = fs.readdirSync(cityPath).filter((file) => {
//     //     return fs.lstatSync(path.join(cityPath, file)).isFile();
//     //   });

//     //   console.log("files", files.length);
//     //   // const imageMap = {};
//     //   files.forEach((t) => {
//     //     const fileName = t;
//     //     const clean = fileName
//     //       .replace(/\.(webp|png|jpg|jpeg)$/i, "")
//     //       .replace(/_[a-zA-Z0-9]+$/, "")
//     //       .replace("_g", "");
//     //     const key = clean.split("/").pop().split("_")[0];
//     //     imageMap[key] = clean;
//     //   });

//     const properties = await Property.findAll();
//     if (!properties || properties.length === 0) {
//       return res.status(404).json({ message: "No Property Data Found" });
//     }

//     console.log("properties", properties);

//     return res.send("okkk");

//     let matchCount = 0;
//     const matchedImages = [];
//     const unmatchedPropertiesImages = [];
//     const matchedKeys = new Set();

//     for (const property of properties) {
//       const house_id = property.house_id;
//       const mediaImages = property.images;

//       if (!Array.isArray(mediaImages)) continue;

//       for (const url of mediaImages) {
//         const pathname = new URL(url).pathname;
//         const fileName = pathname.split("/").pop();

//         const cleanFileName = fileName
//           .replace(/\.(webp|png|jpg|jpeg)$/i, "")
//           .replace(/_[a-zA-Z0-9]+$/, "")
//           .replace("_g", "");
//         const key = cleanFileName.split("_")[0];
//         const matchedFile = result[key];

//         if (matchedFile) {
//           matchedImages.push({
//             house_id,
//             media_url: matchedFile,
//           });
//           matchedKeys.add(cleanFileName);
//           matchCount++;
//         } else {
//           unmatchedPropertiesImages.push({
//             house_id,
//             missing_file: fileName,
//             original_url: url,
//           });
//         }
//       }
//     }

//     const unmatchedTemp = [];
//     for (const key in result) {
//       if (!matchedKeys.has(key)) {
//         const value = result[key];
//         unmatchedTemp.push(value?.raw || value);
//       }
//     }

//     if (matchedImages.length === 0) {
//       return res.status(400).json({
//         message: "No media_images found across all Properties.",
//       });
//     }

//     // const groupByHouse = matchedImages.reduce((acc, item) => {
//     //   if (!acc[item.house_id]) acc[item.house_id] = [];
//     //   acc[item.house_id].push(`${BASE_URL_2}/${item.media_url}`);
//     //   return acc;
//     // }, {});

//     console.log("matchedImages", matchedImages);

//     // const properties = await Property.findAll();
//     // if (!properties || properties.length === 0) {
//     //   return res.status(404).json({ message: "No Property Data Found" });
//     // }

//     // let matchCount = 0;
//     // const matchedImages = [];
//     // const unmatchedPropertiesImages = [];
//     // const matchedKeys = new Set();

//     // for (const property of properties) {
//     //   const house_id = property.house_id;
//     //   const mediaImages = property.images;

//     //   if (!Array.isArray(mediaImages)) continue;

//     //   for (const url of mediaImages) {
//     //     const pathname = new URL(url).pathname;
//     //     const fileName = pathname.split("/").pop();

//     //     const cleanFileName = fileName
//     //       .replace(/\.(webp|png|jpg|jpeg)$/i, "")
//     //       .replace(/_[a-zA-Z0-9]+$/, "")
//     //       .replace("_g", "");

//     //     const matchedFile = imageMap[cleanFileName];

//     //     if (matchedFile) {
//     //       matchedImages.push({
//     //         house_id,
//     //         media_url: matchedFile,
//     //       });
//     //       matchedKeys.add(cleanFileName);
//     //       matchCount++;
//     //     } else {
//     //       unmatchedPropertiesImages.push({
//     //         house_id,
//     //         missing_file: fileName,
//     //         original_url: url,
//     //       });
//     //     }
//     //   }
//     // }

//     // const unmatchedTemp = [];
//     // for (const key in imageMap) {
//     //   if (!matchedKeys.has(key)) {
//     //     const value = imageMap[key];
//     //     unmatchedTemp.push(value?.raw || value);
//     //   }
//     // }

//     // if (matchedImages.length === 0) {
//     //   return res.status(400).json({
//     //     message: "No media_images found across all Properties.",
//     //   });
//     // }

//     // const groupByHouse = matchedImages.reduce((acc, item) => {
//     //   if (!acc[item.house_id]) acc[item.house_id] = [];
//     //   acc[item.house_id].push(`${BASE_URL_2}/${item.media_url}`);
//     //   return acc;
//     // }, {});

//     // console.log("groupByHouse", groupByHouse);

//     // for (const houseId of Object.keys(groupByHouse)) {
//     //   await Property.update(
//     //     { updated_images: groupByHouse[houseId] },
//     //     { where: { house_id: houseId } }
//     //   );
//     // }

//     res.status(200).json({
//       citiesProcessed: cityFolders.length,
//       housesUpdated: Object.keys(groupByHouse).length,
//       totalImagesInserted: Object.values(groupByHouse).flat().length,
//     });
//   } catch (error) {
//     console.error("IMAGE MATCH ERROR:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

exports.syncMissingUpdatedImages = async (req, res) => {
  try {
    // 1. Find all properties where updated_images is NULL
    const missing = await Property.findAll({
      where: {
        updated_images: null,
      },
      attributes: ["house_id"], // Only fetch house_id
    });

    if (!missing.length) {
      return res.json({ message: "No missing updated_images found." });
    }

    // 2. Insert into another table
    const toInsert = missing.map((item) => ({
      house_id: item.house_id,
    }));

    await MissingImages.bulkCreate(toInsert, {
      ignoreDuplicates: true,
    });

    return res.json({
      message: "Missing updated_images house_ids inserted successfully",
      total: toInsert.length,
      data: toInsert,
    });
  } catch (error) {
    console.error("Error syncing missing images:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// insert all image in TempImage(images) table
exports.insertAllImages = async (req, res) => {
  try {
    // const test = require("../../../data/NewPropertiesCountryWiseData/uk/Properties-Images-uk");
    const folderPath = path.join(
      __dirname,
      "../../../data/NewPropertiesCountryWiseData/uk/Properties-Images-uk"
    );

    const files = fs.readdirSync(folderPath).filter((file) => {
      return fs.lstatSync(path.join(folderPath, file)).isFile();
    });
    console.log("Total files found:", files.length);
    return res.send("okk");

    const chunkSize = 100;
    let inserted = 0;
    const transaction = await sequelize.transaction();
    try {
      for (let i = 0; i < files.length; i += chunkSize) {
        const chunk = files.slice(i, i + chunkSize);

        // Format DB rows
        const rows = chunk.map((file) => ({
          images: file, // only file name
        }));
        await TempImage.bulkCreate(rows, {
          transaction: transaction,
        });
        inserted += rows.length;
        console.log(`✔ Inserted chunk ${i / chunkSize + 1}`);
      }
      await transaction.commit();
      console.log("✔ TOTAL INSERTED:", inserted);
      return res.status(200).json({
        success: true,
        inserted,
        message: "All image names inserted successfully!",
      });
    } catch (err) {
      await transaction.rollback();
      console.error(" Transaction failed:", err.message);
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.insertAllCountryImages = async (req, res) => {
  try {
    const BASE_IMAGE_DIR = path.join(
      __dirname
      // "../../../data/NewPropertiesCountryWiseData/uk/uk=f"
    );

    // const a = require("../../../data/NewPropertiesCountryWiseData/uk/uk=f");
    const countries = fs
      .readdirSync(BASE_IMAGE_DIR)
      .filter((c) => fs.lstatSync(path.join(BASE_IMAGE_DIR, c)).isDirectory());

    console.log("country", countries.length);

    let grandTotalInserted = 0;

    for (const country of countries) {
      const countryPath = path.join(BASE_IMAGE_DIR, country);

      const files = fs.readdirSync(countryPath).filter((file) => {
        return fs.lstatSync(path.join(countryPath, file)).isFile();
      });

      const chunkSize = 250;
      let cityInserted = 0;
      const transaction = await sequelize.transaction();
      try {
        for (let i = 0; i < files.length; i += chunkSize) {
          const chunk = files.slice(i, i + chunkSize);

          // Format DB rows
          const rows = chunk.map((file) => ({
            images: file, // only file name
          }));
          await TempImage.bulkCreate(rows, {
            transaction: transaction,
            ignoreDuplicates: true,
          });
          cityInserted += rows.length;
          console.log(`✔ Inserted chunk ${i / chunkSize + 1}`);
        }
        await transaction.commit();
        grandTotalInserted += cityInserted;
      } catch (err) {
        if (!transaction.finished) {
          await transaction.rollback();
        }
        console.error(" Transaction failed:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      inserted: grandTotalInserted,
      message: "All image names inserted successfully!",
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

function cleanImageName(fileName) {
  return fileName
    .replace(/\.(webp|png|jpg|jpeg)$/i, "")
    .replace(/_[a-zA-Z0-9]+$/, "")
    .replace("_g", "");
}

// exports.updateCountryCityFromJson = async (req, res) => {
//   try {
//     const jsonPath = path.join(
//       __dirname,
//       "../../../mukhund_code/Test Images checking/Cities-Properties-Data/uhomes_results.json"
//     );

//     const rawData = fs.readFileSync(jsonPath, "utf-8");
//     const jsonData = JSON.parse(rawData);

//     let updatedCount = 0;
//     const notFound = [];
//     const processedHouseIds = new Set();
//     const totaldata = [];

//     // 1️⃣ Prepare totaldata array
//     for (const page of jsonData) {
//       const records = page?.data?.data || [];

//       for (const item of records) {
//         const houseId = item?.house?.house_id;
//         if (!houseId || processedHouseIds.has(houseId)) continue;

//         processedHouseIds.add(houseId);

//         totaldata.push({
//           house_id: houseId,
//           country: item?.country || null,
//           city: item?.city || null,
//         });
//       }
//     }

//     console.log("totaldata", totaldata);

//     // 2️⃣ Update DB using house_id match
//     // for (const row of totaldata) {
//     //   const [affectedRows] = await Property.update(
//     //     {
//     //       country: row.country, // JSON column
//     //       city: row.city, // JSON column
//     //     },
//     //     {
//     //       where: { house_id: row.house_id },
//     //     }
//     //   );

//     //   if (affectedRows === 0) {
//     //     notFound.push(row.house_id);
//     //   } else {
//     //     updatedCount++;
//     //   }
//     // }

//     return res.status(200).json({
//       success: true,
//       message: "Country & City updated successfully",
//       totalProcessed: totaldata.length,
//       updatedRecords: updatedCount,
//       notMatchedHouseIds: notFound,
//     });
//   } catch (error) {
//     console.error("❌ UPDATE ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

exports.syncCountryCityOnly = async (req, res) => {
  try {
    // const test = require("../../../data/newPropertiesD");
    // const test = require("../../../data/NewPropertiesCountryWiseData/uk/Already-Exist");
    const folderPath = path.join(
      __dirname
      // "../../../data/NewPropertiesCountryWiseData/uk/Already-Exist"
    ); // update if needed
    const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".json"));

    let totalFiles = files.length;
    let totalJsonRecords = 0;
    let totalMatched = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    // 🔹 Fetch existing house_ids once
    const existing = await Property.findAll({
      attributes: ["house_id"],
      raw: true,
    });
    const existingIds = new Set(existing.map((x) => x.house_id));

    const fileWiseSummary = [];
    console.log("files", files.length);
    // return res.send("okk");

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      console.log(`Processing: ${file}`);

      const rawJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (!Array.isArray(rawJson)) continue;

      totalJsonRecords += rawJson.length;

      // 🔹 Extract only required fields
      const countryCityData = extractCountryCityOnly(rawJson).filter((item) =>
        existingIds.has(item.house_id)
      );

      totalMatched += countryCityData.length;

      if (!countryCityData.length) {
        console.log(`No matched house_id in ${file}`);
        continue;
      }
      const transaction = await sequelize.transaction();
      let updatedInFile = 0;

      try {
        for (const item of countryCityData) {
          const [affected] = await Property.update(
            {
              country: item.country,
              city: item.city,
            },
            {
              where: { house_id: item.house_id },
              transaction,
            }
          );

          if (affected > 0) {
            updatedInFile++;
          } else {
            totalSkipped++;
          }
        }

        await transaction.commit();
        totalUpdated += updatedInFile;

        fileWiseSummary.push({
          file,
          matched: countryCityData.length,
          updated: updatedInFile,
          skipped: countryCityData.length - updatedInFile,
        });

        console.log(`✔ ${file} Updated: ${updatedInFile}`);
      } catch (err) {
        await transaction.rollback();
        console.error(`Transaction failed for ${file}`, err);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Country & City updated successfully",
      summary: {
        totalFiles,
        totalJsonRecords,
        totalMatched,
        totalUpdated,
        totalSkipped,
      },
      fileWiseSummary,
    });
  } catch (error) {
    console.error("Country-City sync error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// try {

//   // const test = require("../../../data/NewPropertiesCountryWiseData/uk/Properties-Images-uk");
//   const BASE_IMAGE_DIR = path.join(
//     __dirname,
//     "../../../data/NewPropertiesCountryWiseData/"
//   );

//   const countries = fs
//     .readdirSync(BASE_IMAGE_DIR)
//     .filter((c) => fs.lstatSync(path.join(BASE_IMAGE_DIR, c)).isDirectory());

//   let totalMatched = 0;
//   let totalUnmatched = 0;

//   for (const country of countries) {
//     const countryPath = path.join(BASE_IMAGE_DIR, country);

//     const cities = fs
//       .readdirSync(countryPath)
//       .filter((city) => fs.lstatSync(path.join(countryPath, city)).isDirectory());

//     for (const city of cities) {
//       console.log(`🔍 Processing ${country}/${city}`);

//       const cityPath = path.join(countryPath, city);

//       const files = fs
//         .readdirSync(cityPath)
//         .filter((file) => fs.lstatSync(path.join(cityPath, file)).isFile());

//       /** 1️⃣ Build tempMap for this city */
//       const tempMap = {};
//       files.forEach((file) => {
//         const cleanFileName = cleanImageName(file);
//         tempMap[cleanName] = file;
//       });

//       /** 2️⃣ Fetch properties city-wise */
//       const properties = await Property.findAll({
//         where: { city_name: city },
//       });

//       if (!properties.length) {
//         console.log(`⚠️ No properties for city: ${city}`);
//         continue;
//       }

//       const matchedImages = [];
//       const matchedKeys = new Set();
//       const unmatchedPropertyImages = [];

//       /** 3️⃣ Compare DB images with folder images */
//       for (const property of properties) {
//         const house_id = property.house_id;
//         const mediaImages = property.images;

//         if (!Array.isArray(mediaImages)) continue;

//         for (const url of mediaImages) {
//           const pathname = new URL(url).pathname;
//           const fileName = pathname.split("/").pop();
//           const cleanName = cleanImageName(fileName);

//           if (tempMap[cleanName]) {
//             matchedImages.push({
//               house_id,
//               media_url: `${BASE_URL_2}/${tempMap[cleanName]}`,
//             });
//             matchedKeys.add(cleanName);
//             totalMatched++;
//           } else {
//             unmatchedPropertyImages.push({
//               house_id,
//               missing_file: fileName,
//             });
//             totalUnmatched++;
//           }
//         }
//       }

//       /** 4️⃣ Group by house_id */
//       const groupByHouse = matchedImages.reduce((acc, item) => {
//         if (!acc[item.house_id]) acc[item.house_id] = [];
//         acc[item.house_id].push(item.media_url);
//         return acc;
//       }, {});

//       console.log("groupHouse", groupByHouse);

//       /** 5️⃣ Update DB */
//       // for (const houseId of Object.keys(groupByHouse)) {
//       //   await Property.update(
//       //     { updated_images: groupByHouse[houseId] },
//       //     { where: { house_id: houseId } }
//       //   );
//       // }

//       console.log(
//         `✅ ${city}: matched=${matchedImages.length}, unmatched=${unmatchedPropertyImages.length}`
//       );
//     }
//   }

//   res.status(200).json({
//     message: "Country-wise image comparison completed",
//     totalMatched,
//     totalUnmatched,
//   });
// } catch (error) {
//   console.error("❌ Error:", error);
//   res.status(500).json({ message: "Internal server error" });
// }

// const BASE_URL = "https://acolyteliving.startupflora.com/new_images";
// // const BASE_URL_2 = "https://storage.googleapis.com/acolyte-living-img/new_images";
// // compare images in Properties Table with filter images and insert matched images in updated_images column
// exports.compareImageswithPropertyTable = async (req, res) => {
//   try {
//     // const temps = await TempImage.findAll();
//     // D:\Acolyte Technologies\mukhund_code\archive (1)\Test Images checking\images
//     // const test = require("../../../data/NewPropertiesCountryWiseData/fr/Properties-Images-Fr/amiens");
//     const filepath = path.join(
//       __dirname,
//       "../../../data/NewPropertiesCountryWiseData/fr/Properties-Images-Fr"
//     );

//     const files = fs.readdirSync(filepath).filter((file) => {
//       return fs.lstatSync(path.join(filepath, file)).isFile();
//     });

//     // files.forEach((t) => {
//     //   // const clean = t.replace(".webp", "").replace(/_/g, "/");
//     //   const clean = t
//     //     .replace(".webp", "")
//     //     .replace(".png", "")
//     //     .replace(".jpg", "")
//     //     .replace(".jpeg", "")
//     //     .replace(/_[a-zA-Z0-9]+$/, "")
//     //     .split("_")[0];
//     //   const key = clean.split("/").pop().split("_")[0];
//     //   tempMap[key] = clean;
//     // });
//     tempMap = {};
//     files.forEach((file) => {
//       const cleanName = file
//         .replace(/\.(webp|png|jpg|jpeg)$/i, "")
//         .replace(/_[a-zA-Z0-9]+$/, "")
//         .replace("_g", "");

//       tempMap[cleanName] = file; // 🔑 key = clean, value = real filename
//     });

//     // const properties = await Property.findAll();
//     // if (!properties || properties.length === 0) {
//     //   return res.status(404).json({ message: "No Property Data Found" });
//     // }
//     const properties = await Property.findAll({
//       where: {
//         city_name: "Amiens",
//       },
//     });
//     if (!properties || properties.length === 0) {
//       return res.status(404).json({ message: "No Property Data Found" });
//     }

//     // console.log("tempMap", tempMap);
//     // console.log("properties", properties.length);
//     // console.log("total", files.length);
//     // return res.send("okk");

//     let matchCount = 0;
//     const matchedImages = [];
//     const unmatchedPropertiesImages = [];
//     const matchedKeys = new Set();

//     // for (const property of properties) {
//     //   const house_id = property.dataValues.house_id;
//     //   const mediaImages = property.dataValues.images;
//     //   if (!mediaImages || mediaImages.length === 0) continue;
//     //   for (const url of mediaImages) {
//     //     const pathname = new URL(url).pathname;
//     //     const fileName = pathname.split("/").pop();
//     //     const cleanFileName = fileName
//     //       .replace(".webp", "")
//     //       .replace(".png", "")
//     //       .replace(".jpg", "")
//     //       .replace(".jpeg", "")
//     //       .replace(/_[a-zA-Z0-9]+$/, "")
//     //       .replace("_g", "");
//     //     const isMatch = tempMap[cleanFileName];
//     //     if (isMatch) {
//     //       const mediaValue = tempMap[`${cleanFileName}.webp`];
//     //       matchedImages.push({
//     //         house_id,
//     //         media_url: mediaValue,
//     //       });
//     //       matchCount++;
//     //       matchedKeys.add(fileName);
//     //     } else {
//     //       unmatchedPropertiesImages.push({
//     //         house_id,
//     //         missing_file: fileName,
//     //         expected_key: pathname,
//     //         original_url: url,
//     //       });
//     //     }
//     //   }
//     // }

//     for (const property of properties) {
//       const house_id = property.house_id;
//       const mediaImages = property.images;

//       if (!Array.isArray(mediaImages)) continue;

//       for (const url of mediaImages) {
//         const pathname = new URL(url).pathname;
//         const fileName = pathname.split("/").pop();

//         const cleanFileName = fileName
//           .replace(/\.(webp|png|jpg|jpeg)$/i, "")
//           .replace(/_[a-zA-Z0-9]+$/, "")
//           .replace("_g", "");

//         const matchedFile = tempMap[cleanFileName];

//         if (matchedFile) {
//           matchedImages.push({
//             house_id,
//             media_url: matchedFile,
//           });
//           matchedKeys.add(cleanFileName);
//           matchCount++;
//         } else {
//           unmatchedPropertiesImages.push({
//             house_id,
//             missing_file: fileName,
//             original_url: url,
//           });
//         }
//       }
//     }

//     const unmatchedTemp = [];
//     for (const key in tempMap) {
//       if (!matchedKeys.has(key)) {
//         const value = tempMap[key];
//         unmatchedTemp.push(value?.raw || value);
//       }
//     }

//     if (matchedImages.length === 0) {
//       return res.status(400).json({
//         message: "No media_images found across all Properties.",
//       });
//     }

//     // Group matched by house
//     // const groupByHouse = matchedImages.reduce((acc, item) => {
//     //   if (!acc[item.house_id]) acc[item.house_id] = [];
//     //   acc[item.house_id].push(item.media_url);
//     //   return acc;
//     // }, {});

//     const groupByHouse = matchedImages.reduce((acc, item) => {
//       if (!acc[item.house_id]) acc[item.house_id] = [];
//       acc[item.house_id].push(`${BASE_URL_2}/${item.media_url}`);
//       return acc;
//     }, {});

//     console.log("groupByHouse", groupByHouse);

//     // const houseIds = Object.keys(groupByHouse);

//     for (const houseId of Object.keys(groupByHouse)) {
//       await Property.update(
//         { updated_images: groupByHouse[houseId] },
//         { where: { house_id: houseId } }
//       );
//     }

//     // for (const houseId of houseIds) {
//     //   // Fetch property row
//     //   const property = await Property.findOne({
//     //     where: { house_id: houseId },
//     //   });

//     //   if (!property) {
//     //     console.log(`Property not found for house_id: ${houseId}`);
//     //     continue;
//     //   }

//     //   // Filter: Keep only those that match matchedImages list
//     //   const allowedFiles = groupByHouse[houseId].map((s) => s);

//     //   const filteredImages = allowedFiles.map((imgObj) => {
//     //     return `${BASE_URL_2}/${imgObj}`;
//     //   });

//     //   // Save into DB
//     //   property.set("updated_images", filteredImages);
//     //   await property.save();
//     // }

//     res.status(200).json({
//       TotalFilter: files.length,
//       message: `Successfully Inserted ${matchedImages.length}.`,
//       insertedCount: matchedImages.length,
//       matchedCount: matchedImages.length,
//       ImagesUnmatched: unmatchedPropertiesImages.length,
//       unmatchedTempImagesCount: unmatchedTemp.length,
//       Imagesunmatched: unmatchedPropertiesImages,
//       unmatchedTempImages: unmatchedTemp,
//     });
//   } catch (error) {
//     console.error("Error inserting all house media:", error);
//     res.status(500).json({ message: "Internal server error - in -" });
//   }
// };

// exports.updateCountryCityFromJson = async (req, res) => {
//   try {
//     const jsonPath = path.join(
//       __dirname,
//       "../../../mukhund_code/Test Images checking/Cities-Properties-Data/uhomes_results.json"
//     );

//     const rawData = fs.readFileSync(jsonPath, "utf-8");
//     const jsonData = JSON.parse(rawData);

//     let updatedCount = 0;
//     let notFound = [];
//     const processedHouseIds = new Set(); // 🔒 prevent multiple updates
//     const totaldata = [];
//     for (const page of jsonData) {
//       const records = page?.data?.data || [];

//       for (const item of records) {
//         const houseId = item?.house?.house_id;
//         const countryName = item?.country || null;
//         const cityName = item?.city || null;

//         const data = {
//           house_id: houseId,
//           country: countryName,
//           city: cityName,
//         };

//         totaldata.push(data);

//         // if (!houseId) continue;

//         // if (processedHouseIds.has(houseId)) {
//         //   continue;
//         // }
//         // processedHouseIds.add(houseId);

//         // const [affectedRows] = await Property.update(
//         //   {
//         //     country: countryName,
//         //     city: cityName,
//         //   },
//         //   {
//         //     where: { house_id: houseId },
//         //   }
//         // );

//         // if (affectedRows > 0) {
//         //   updatedCount++;
//         // } else {
//         //   notFound.push(houseId);
//         // }
//       }
//     }

//     console.log("totaldata", Object.keys(totaldata).length);
//     return res.status(200).json({
//       success: true,
//       message: "Country & City updated successfully",
//       updatedRecords: updatedCount,
//       notMatchedHouseIds: notFound,
//       totalProcessed: processedHouseIds.size,
//     });
//   } catch (error) {
//     console.error("❌ UPDATE ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

// exports.updateCountryCityFromJson = async (req, res) => {
//   try {
//     const jsonPath = path.join(
//       __dirname,
//       "../../../mukhund_code/Test Images checking/Cities-Properties-Data/uhomes_results.json"
//     );

//     const rawData = fs.readFileSync(jsonPath, "utf-8");
//     const jsonData = JSON.parse(rawData);

//     let updatedCount = 0;
//     let notFound = [];
//     const processedHouseIds = new Set(); // 🔒 prevent multiple updates
//     const totaldata = [];
//     for (const page of jsonData) {
//       const records = page?.data?.data || [];

//       for (const item of records) {
//         const houseId = item?.house?.house_id;
//         const countryName = item?.country || null;
//         const cityName = item?.city || null;

//         const data = {
//           house_id: houseId,
//           country: countryName,
//           city: cityName,
//         };

//         totaldata.push(data);

//         // if (!houseId) continue;

//         // if (processedHouseIds.has(houseId)) {
//         //   continue;
//         // }
//         // processedHouseIds.add(houseId);

//         // const [affectedRows] = await Property.update(
//         //   {
//         //     country: countryName,
//         //     city: cityName,
//         //   },
//         //   {
//         //     where: { house_id: houseId },
//         //   }
//         // );

//         // if (affectedRows > 0) {
//         //   updatedCount++;
//         // } else {
//         //   notFound.push(houseId);
//         // }
//       }
//     }

//     console.log("totaldata", Object.keys(totaldata).length);
//     return res.status(200).json({
//       success: true,
//       message: "Country & City updated successfully",
//       updatedRecords: updatedCount,
//       notMatchedHouseIds: notFound,
//       totalProcessed: processedHouseIds.size,
//     });
//   } catch (error) {
//     console.error("❌ UPDATE ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };
