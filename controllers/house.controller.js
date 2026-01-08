const { db } = require("../models");
const houseModel = db.house;
const Property = db.properties;
const TempImage = db.images;
const houseMediaModel = db.house_media;
const sequelize = db.sequelize;
const path = require("path");
const fs = require("fs");

exports.getAllHouse = async (req, res) => {
  try {
    // Extract pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await houseModel.findAndCountAll({
      limit,
      offset,
      include: [
        {
          model: houseMediaModel,
          as: "house_media",
        },
      ],
      // order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching houses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getOneHouse = async (req, res) => {
  const id = req.query.id;
  try {
    const house = await houseModel.findByPk(id);
    if (house) {
      res.status(200).json(house);
    } else {
      res.status(404).json({ message: "House not found" });
    }
  } catch (error) {
    console.error("Error fetching house:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getHouseMediaById = async (req, res) => {
  // const id = req.query.id;
  const { id } = req.params;
  try {
    const houseMedia = await houseMediaModel.findAll({
      where: { house_id: id },
    });

    res.status(200).json({
      Total: houseMedia.length,
      HouseMedia: houseMedia,
    });
  } catch (error) {
    console.error("Error fetching house media:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Step 1st
// insert Media Data in House Table
exports.insertDataInHouseTable = async (req, res) => {
  try {
    // D:\Ācolyte_Living_Code\data\Jahid\properties_houseMedia
    const filePath = path.join(
      __dirname
      // "../../../data/NewPropertiesCountryWiseData/fr/Properties-HouseMediaData-Fr"
    );
    // const test =require("../../../data/NewPropertiesCountryWiseData/fr/Properties-HouseMediaData-Fr");

    const files = fs.readdirSync(filePath).filter((file) => file.endsWith(".json"));
    console.log("Total files:", files.length);
    let insertCount = 0; // counter
    for (const file of files) {
      try {
        const houseId = parseInt(file.replace(".json", ""), 10);

        if (isNaN(houseId)) {
          console.warn(`Invalid file name (not numeric): ${file}`);
          continue;
        }

        const exists = await houseModel.findOne({
          where: { house_id: houseId },
        });

        if (exists) {
          skipCount++;
          console.log(`Skipped (already exists): House ID ${houseId}`);
          continue;
        }

        const fileData = JSON.parse(fs.readFileSync(path.join(filePath, file), "utf-8"));
        const data = {
          house_id: houseId,
          data: fileData || null,
        };
        const house = await houseModel.create(data);
        insertCount++;
        console.log(`Inserted: ${insertCount}/${files.length} → House ID: ${houseId}`);
        // if (fileData.images && Array.isArray(fileData.images)) {
        //   for (const img of fileData.images) {
        //     await HouseMedia.create({
        //       house_id: house.id, // FK to house table
        //       image_url: img,
        //     });
        //   }
        // }
      } catch (err) {
        console.error(`Error in file: ${file}`, err.message);
      }
    }
    return res.status(200).json({
      success: true,
      message: `Total Inserted: ${insertCount}/${files.length}`,
    });
  } catch (err) {
    console.error("Main Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error while inserting house data",
      error: err.message,
    });
  }
};

// Step 2nd
// Insert All Media Image in House_media
exports.insertAllHouseMediaImages = async (req, res) => {
  // const { house: House, house_media: HouseMedia } = db;

  try {
    const houses = await House.findAll();
    const rows = [];

    for (const house of houses) {
      const houseId = house.house_id;
      const mediaSources = house.data?.media || [];

      for (const source of mediaSources) {
        const sourceType =
          source.type && source.type.includes("source_type_")
            ? Number(source.type.split("_").pop())
            : source.source_type || null;

        for (const block of source.items || []) {
          traverseItems({
            houseId,
            sourceType,
            category: block.name || block.type || "General",
            categoryType: block.type || null,
            items: block.items || [],
            collector: rows,
          });
        }
      }
    }

    if (!rows.length) {
      return res.status(400).json({ message: "No media found" });
    }

    const CHUNK_SIZE = 500;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      await HouseMedia.bulkCreate(rows.slice(i, i + CHUNK_SIZE), {
        validate: true,
        ignoreDuplicates: true,
      });
    }

    res.json({
      message: "House media inserted successfully",
      inserted: rows.length,
    });
  } catch (err) {
    console.error("HOUSE MEDIA ERROR:", err.message);
    console.error(err.stack);

    res.status(500).json({
      message: "Insert failed",
      error: err.message,
    });
  }
};

// compare images in house_media table
exports.insertAllImagesInHouseMedia = async (req, res) => {
  // try {
  //   // const properties = await Property.findAll({ limit: 7000 });
  //   const temps = await TempImage.findAll();
  //   const houseMedia = await houseMediaModel.findAll();
  //   if (!houseMedia || houseMedia.length === 0) {
  //     return res.status(404).json({ message: "No house_media Data Found" });
  //   }
  //   const tempIDs = temps.map((t) => {
  //     const fileName = t.dataValues.images;
  //     const parts = fileName.replace(".webp", "").replace(/_/g, "/");
  //     return parts;
  //   });
  //   const matchedImages = [];
  //   let houseLoopCount = 0;
  //   let tempLoopCount = 0;
  //   let matchCount = 0;
  //   for (const house of houseMedia) {
  //     houseLoopCount++;
  //     const house_id = house.dataValues.house_id;
  //     const mediaImages = house.dataValues.media_url;
  //     //  image_1387_01HY5EWYE6QRDD6V2HAMSDYQ22.webp
  //     if (!mediaImages || mediaImages.length === 0) continue;
  //     const fileName = mediaImages.replace(".webp", "").split("_").pop();
  //     for (const temp of tempIDs) {
  //       tempLoopCount++;
  //       const filetemp = temp.split("/").pop();
  //       const cleantemp = filetemp.split("_")[0];
  //       if (cleantemp === fileName) {
  //         matchedImages.push({
  //           house_id: house_id,
  //           media_url: temp,
  //         });
  //         matchCount++;
  //       } else {
  //         continue;
  //       }
  //     }
  //   }
  //   console.log("Total House Loops:", houseLoopCount);
  //   console.log("Total Temp Loops:", tempLoopCount);
  //   console.log("Total Matches Found:", matchCount);
  //   if (matchedImages.length === 0) {
  //     return res
  //       .status(400)
  //       .json({ message: "No media_images found across all Properties." });
  //   }
  //   // const batchSize = 500;
  //   // for (let i = 0; i < matchedImages.length; i += batchSize) {
  //   //   const batch = matchedImages.slice(i, i + batchSize);
  //   //   await houseMediaModel.bulkCreate(batch);
  //   //   console.log(`Inserted batch ${i / batchSize + 1}, Rows: ${batch.length}`);
  //   // }
  //   res.status(200).json({
  //     message: `Inserted ${matchedImages.length}.`,
  //     insertedCount: matchedImages.length,
  //     loops: {
  //       houseLoopCount,
  //       tempLoopCount,
  //       matchCount,
  //     },
  //   });
  // } catch (error) {
  //   console.error("Error inserting all house media:", error);
  //   res.status(500).json({ message: "Internal server error" });
  // }
};

// compare images in house_media table
const BASE_URL_2 = "https://storage.googleapis.com/acolyte-living-img/new_images";
exports.compareAllImagesInHouseMedia = async (req, res) => {
  try {
    const temps = await TempImage.findAll();
    // const houseMedia = await houseMediaModel.findAll();

    if (!houseMedia || houseMedia.length === 0) {
      return res.status(404).json({ message: "No house_media Data Found" });
    }

    const tempMap = {};
    temps.forEach((t) => {
      const fileName = t.dataValues.images;
      const clean = fileName
        .replace(/\.(webp|png|jpg|jpeg)$/i, "")
        .replace(/_[a-zA-Z0-9]+$/, "")
        .replace("_g", "");
      const key = clean.split("/").pop().split("_")[0];
      tempMap[key] = fileName;
    });

    let matchCount = 0;
    const matchedImages = [];
    const unmatchedMedia = [];
    const matchedKeys = new Set();

    for (const house of houseMedia) {
      const house_id = house.dataValues.house_id;
      const mediaImages = house.dataValues.media_url;

      if (!mediaImages) continue;
      const fileName = mediaImages
        .replace(/\.(webp|png|jpg|jpeg)$/i, "")
        .replace(/_[a-zA-Z0-9]+$/, "")
        .replace("_g", "");
      const key = fileName.split("/").pop().split("_")[0];
      const matchedFile = tempMap[key];
      console.log("matchedFile", matchedFile);
      if (matchedFile) {
        matchedImages.push({
          house_id,
          media_url: `${BASE_URL_2}/${matchedFile}`,
        });
        matchCount++;
        matchedKeys.add(fileName);
      } else {
        unmatchedMedia.push(mediaImages);
      }
    }

    const unmatchedTemp = [];
    for (const key in tempMap) {
      if (!matchedKeys.has(key)) unmatchedTemp.push(tempMap[key].raw);
    }

    const chunkSize = 500;
    const transaction = await sequelize.transaction();

    try {
      for (let i = 0; i < matchedImages.length; i += chunkSize) {
        const chunk = matchedImages.slice(i, i + chunkSize);

        for (const item of chunk) {
          await houseMediaModel.update(
            { media_url: item.media_url },
            {
              where: { house_id: item.house_id },
              transaction,
            }
          );
        }

        console.log(`✔ Updated chunk ${i / chunkSize + 1}, Rows: ${chunk.length}`);
      }

      await transaction.commit();
      console.log(`Updated total ${matchedImages.length} images`);
    } catch (err) {
      await transaction.rollback();
      console.error("Update failed:", err.message);
    }

    // const batchSize = 500;
    // for (let i = 0; i < matchedImages.length; i += batchSize) {
    //   const batch = matchedImages.slice(i, i + batchSize);
    //   await houseMediaModel.bulkCreate(batch);
    //   console.log(`Inserted batch ${i / batchSize + 1}, Rows: ${batch.length}`);
    // }

    console.log("Matched:", matchedImages.length);
    console.log("Unmatched House Media:", unmatchedMedia.length);
    console.log("Unmatched Temp Images:", unmatchedTemp.length);

    console.log("Total Matches:", matchCount);

    res.status(200).json({
      message: `Matched: ${matchedImages.length}`,
      matchedImages,
      matchCount,
      matchedCount: matchedImages.length,
      unmatchedHouseMediaCount: unmatchedMedia.length,
      unmatchedTempImagesCount: unmatchedTemp.length,
      unmatchedHouseMedia: unmatchedMedia,
      unmatchedTempImages: unmatchedTemp,
    });
  } catch (error) {
    console.error("Error inserting:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// compare images in Properties Table with media image from temp Images
exports.compareImageswithPropertyTable = async (req, res) => {
  try {
    const temps = await TempImage.findAll();
    const properties = await Property.findAll();

    if (!properties || properties.length === 0) {
      return res.status(404).json({ message: "No Property Data Found" });
    }

    tempMap = {};
    temps.forEach((t) => {
      const fileName = t.dataValues.images;
      const cleanName = fileName
        .replace(/\.(webp|png|jpg|jpeg)$/i, "")
        .replace(/_[a-zA-Z0-9]+$/, "")
        .replace("_g", "");

      tempMap[cleanName] = fileName; // 🔑 key = clean, value = real filename
    });

    console.log("tempMap", Object.keys(tempMap).length);

    let matchCount = 0;
    const matchedImages = [];
    const unmatchedPropertiesMedia = [];
    const matchedKeys = new Set();

    for (const property of properties) {
      const house_id = property.house_id;
      const mediaImages = property.images;

      if (!Array.isArray(mediaImages)) continue;

      for (const url of mediaImages) {
        const pathname = new URL(url).pathname;
        const fileName = pathname.split("/").pop();
        const cleanFileName = fileName
          .replace(/\.(webp|png|jpg|jpeg)$/i, "")
          .replace(/_[a-zA-Z0-9]+$/, "")
          .replace("_g", "");

        const matchedFile = tempMap[cleanFileName];

        if (matchedFile) {
          matchedImages.push({
            house_id,
            media_url: matchedFile,
          });
          matchedKeys.add(cleanFileName);
          matchCount++;
        } else {
          unmatchedPropertiesMedia.push({
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

    res.status(200).json({
      message: `Inserted ${matchedImages.length}.`,
      insertedCount: matchedImages.length,
      matchedImages,
      matchCount,
      unmatchedTempImagesCount: unmatchedTemp.length,
      unmatchedHouseMedia: unmatchedPropertiesMedia,
      unmatchedTempImages: unmatchedTemp,
    });
  } catch (error) {
    console.error("Error inserting all house media:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// exports.insertAllHouseImages = async (req, res) => {
//   const { house: House, house_media: HouseMedia } = db;

//   try {
//     const houses = await House.findAll();

//     if (!houses || houses.length === 0) {
//       return res.status(404).json({ message: "No houses found in database." });
//     }

//     const allMediaEntries = [];

//     for (const house of houses) {
//       const id = house.idhouse;
//       const mediaSources = house.data?.media || [];

//       for (const source of mediaSources) {
//         const mediaGroups = source.items || [];

//         for (const group of mediaGroups) {
//           const category = group.name;
//           const groupItems = group.items || [];

//           for (const item of groupItems) {
//             // Some items might have nested items (e.g., floor plans)
//             const subItems = item.items || [item];

//             for (const media of subItems) {
//               if (!media.media_img || !media.media_img.path) continue;

//               const rawPath = media.media_img.path;
//               const convertedPath = rawPath.replace(/\//g, "_");

//               allMediaEntries.push({
//                 idhouse: id,
//                 category: category,
//                 description: media.description || "",
//                 media_type: "image",
//                 media_url: convertedPath,
//                 thumbnail_url: "", // Optional
//                 sort_order: media.sort || 0,
//                 unit_id: media.unit_id || null,
//                 source_type: media.source_type || null
//               });
//             }
//           }
//         }
//       }
//     }

//     if (allMediaEntries.length === 0) {
//       return res.status(400).json({ message: "No media images found across all houses." });
//     }

//     await HouseMedia.bulkCreate(allMediaEntries);

//     res.status(200).json({
//       message: `Inserted ${allMediaEntries.length} media records across ${houses.length} houses.`,
//       insertedCount: allMediaEntries.length
//     });
//   } catch (error) {
//     console.error("Error inserting all house media:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const buildImageUrl = (mediaImg) => {
  if (!mediaImg?.path) return null;

  const suffix = mediaImg.suffix?.includes("g") ? "_g" : "_h";

  return `https://media.uhzcdn.com/${mediaImg.path.replace(".webp", "")}${suffix}.webp`;
};

const normalizeMediaItem = ({ houseId, sourceType, category, categoryType, item }) => {
  let row = null;

  if (item.media_img?.path) {
    const url = buildImageUrl(item.media_img);
    if (!url) return null;

    row = {
      house_id: houseId,
      media_type: "image",
      media_url: url,
      updated_url: null,
      thumbnail_url: null,
    };
  } else if (item.video_url) {
    row = {
      house_id: houseId,
      media_type: "video",
      media_url: item.video_url,
      updated_url: null,
      thumbnail_url: item.thumb_url || null,
    };
  } else if (item.url && item.media_img?.legacy_url) {
    row = {
      house_id: houseId,
      media_type: "vr",
      media_url: item.url,
      updated_url: null,
      thumbnail_url: item.media_img.legacy_url,
    };
  } else if (item.playback_video_url) {
    row = {
      house_id: houseId,
      media_type: "live",
      media_url: item.playback_video_url,
      updated_url: null,
      thumbnail_url: item.cover_picture || null,
    };
  }

  if (!row) return null; // 🚨 BLOCK BAD ROWS

  return {
    ...row,
    source_type: sourceType,
    category_name: category,
    category_type: categoryType,
    description: item.description || item.name || "",
    sort_order: item.sort || item.media_sort || 0,
    unit_id: item.unit_id || null,
    is_cover: !!item.is_cover,
    raw_json: item,
  };
};

const traverseItems = ({
  houseId,
  sourceType,
  category,
  categoryType,
  items,
  collector,
  depth = 0,
}) => {
  if (!Array.isArray(items) || depth > 5) return;

  for (const item of items) {
    const row = normalizeMediaItem({
      houseId,
      sourceType,
      category,
      categoryType,
      item,
    });

    if (row) collector.push(row);

    if (Array.isArray(item.items)) {
      traverseItems({
        houseId,
        sourceType,
        category,
        categoryType,
        items: item.items,
        collector,
        depth: depth + 1,
      });
    }
  }
};

// exports.compareImageswithPropertyTable = async (req, res) => {
//   try {
//     const temps = await TempImage.findAll();
//     const properties = await Property.findAll();

//     if (!properties || properties.length === 0) {
//       return res.status(404).json({ message: "No Property Data Found" });
//     }

//     // tempMap = {};
//     // temps.forEach((t) => {
//     //   const fileName = t.dataValues.images;
//     //   const clean = fileName.replace(".webp", "").replace(/_/g, "/");
//     //   const key = clean.split("/").pop().split("_")[0];
//     //   tempMap[key] = clean;
//     // });

//     tempMap = {};
//     temps.forEach((t) => {
//       const fileName = t.dataValues.images;
//       const cleanName = fileName
//         .replace(/\.(webp|png|jpg|jpeg)$/i, "")
//         .replace(/_[a-zA-Z0-9]+$/, "")
//         .replace("_g", "");

//       tempMap[cleanName] = fileName; // 🔑 key = clean, value = real filename
//     });

//     console.log("tempMap", Object.keys(tempMap).length);

//     let matchCount = 0;
//     const matchedImages = [];
//     const unmatchedPropertiesMedia = [];
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

//         const matchedFile = tempMap[cleanFileName];

//         if (matchedFile) {
//           matchedImages.push({
//             house_id,
//             media_url: matchedFile,
//           });
//           matchedKeys.add(cleanFileName);
//           matchCount++;
//         } else {
//           unmatchedPropertiesMedia.push({
//             house_id,
//             missing_file: fileName,
//             original_url: url,
//           });
//         }
//       }
//     }

//     // for (const property of properties) {
//     //   const house_id = property.dataValues.house_id;
//     //   const mediaImages = property.dataValues.media;
//     //   if (!mediaImages || mediaImages.length === 0) continue;
//     //   for (const url of mediaImages) {
//     //     const pathname = new URL(url).pathname;
//     //     let finalPath = pathname
//     //       .replace(".webp", "")
//     //       .replace(".png", "")
//     //       .replace(".jpg", "")
//     //       .replace(".jpeg", "")
//     //       .replace(/_[a-zA-Z0-9]+$/, "")
//     //       .split("_")[0];
//     //     const fileName = finalPath.split("/").pop();
//     //     const cleanId = fileName.split("_")[0];

//     //     if (tempMap[cleanId]) {
//     //       matchedImages.push({
//     //         house_id,
//     //         media_url: tempMap[`${fileName}.webp`],
//     //       });
//     //       matchCount++;
//     //       matchedKeys.add(fileName);
//     //     } else {
//     //       unmatchedPropertiesMedia.push(mediaImages);
//     //     }

//     //     // for (const temp of tempIDs) {
//     //     //   const filetemp = temp.split("/").pop();
//     //     //   const cleantemp = filetemp.split("_")[0];
//     //     //   if (cleantemp === cleanId) {
//     //     //     matchedImages.push({
//     //     //       house_id: house_id,
//     //     //       media_type: "image",
//     //     //       media_url: temp,
//     //     //       category: "",
//     //     //       description: "",
//     //     //       thumbnail_url: "", // Optional
//     //     //       sort_order: 0,
//     //     //       unit_id: null,
//     //     //       source_type: null,
//     //     //     });
//     //     //   } else {
//     //     //     continue;
//     //     //   }
//     //     // }
//     //   }
//     // }

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

//     // const houseIds = Object.keys(groupByHouse);

//     // for (const houseId of Object.keys(groupByHouse)) {
//     //   await Property.update(
//     //     { updated_images: groupByHouse[houseId] },
//     //     { where: { house_id: houseId } }
//     //   );
//     // }

//     console.log("matchedImages", matchedImages.length);
//     return res.send("okk");

//     // const unmatchedTemp = [];
//     // for (const key in tempMap) {
//     //   if (!matchedKeys.has(key)) unmatchedTemp.push(tempMap[key].raw);
//     // }

//     // if (matchedImages.length === 0) {
//     //   return res
//     //     .status(400)
//     //     .json({ message: "No media_images found across all Properties." });
//     // }

//     // console.log("Matched:", matchedImages.length);
//     // console.log("Unmatched House Media:", unmatchedPropertiesMedia.length);
//     // console.log("Unmatched Temp Images:", unmatchedTemp.length);

//     // console.log("Total Matches:", matchCount);

//     res.status(200).json({
//       message: `Inserted ${matchedImages.length}.`,
//       insertedCount: matchedImages.length,
//       matchedImages,
//       matchCount,
//       matchedCount: matchedImages.length,
//       unmatchedHouseMediaCount: unmatchedPropertiesMedia.length,
//       unmatchedTempImagesCount: unmatchedTemp.length,
//       unmatchedHouseMedia: unmatchedPropertiesMedia,
//       unmatchedTempImages: unmatchedTemp,
//     });
//   } catch (error) {
//     console.error("Error inserting all house media:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
