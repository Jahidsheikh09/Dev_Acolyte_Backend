const { db } = require("../../models");
const RoomType = db.house_room_types;

const { Op, Sequelize, literal } = require("sequelize");

const parseJSON = (value, defaultValue) => {
  try {
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

exports.getAllRoomTypes = async (req, res) => {
  try {
    const { id } = req.params; // ✅ house_id from params

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // --------------------------------------
    // BASE CONDITION (house_id REQUIRED)
    // --------------------------------------
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "house_id is required",
      });
    }

    const whereConditions = {
      house_id: id,
    };

    // --------------------------------------
    // FILTERS
    // --------------------------------------
    if (req.query.booking_status) {
      whereConditions.booking_status = Number(req.query.booking_status);
    }

    if (req.query.type_id) {
      whereConditions.type_id = Number(req.query.type_id);
    }

    if (req.query.unit_id) {
      whereConditions.unit_id = Number(req.query.unit_id);
    }

    // --------------------------------------
    // GLOBAL SEARCH (name, sku)
    // --------------------------------------
    if (req.query.search) {
      const search = req.query.search.trim().toLowerCase();

      whereConditions[Op.and] = [
        {
          [Op.or]: [
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("name")), {
              [Op.like]: `%${search}%`,
            }),
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("sku")), {
              [Op.like]: `%${search}%`,
            }),
          ],
        },
      ];
    }

    // --------------------------------------
    // PRICE FILTER
    // --------------------------------------
    if (req.query.min_price || req.query.max_price) {
      whereConditions.rent_amount_value = {};
      if (req.query.min_price) {
        whereConditions.rent_amount_value[Op.gte] = Number(req.query.min_price);
      }
      if (req.query.max_price) {
        whereConditions.rent_amount_value[Op.lte] = Number(req.query.max_price);
      }
    }

    // --------------------------------------
    // BED / BATH FILTER
    // --------------------------------------
    if (req.query.bed_count) {
      whereConditions.bed_count = Number(req.query.bed_count);
    }

    if (req.query.bathroom_count) {
      whereConditions.bathroom_count = Number(req.query.bathroom_count);
    }

    // --------------------------------------
    // COUNT TOTAL
    // --------------------------------------
    const totalCount = await RoomType.count({
      where: whereConditions,
    });

    // --------------------------------------
    // SORTING
    // --------------------------------------
    let orderClause = [["sort", "ASC"]];

    if (req.query.sort === "low_to_high") {
      orderClause = [["rent_amount_value", "ASC"]];
    } else if (req.query.sort === "high_to_low") {
      orderClause = [["rent_amount_value", "DESC"]];
    } else if (req.query.sort === "bed_count") {
      orderClause = [["bed_count", "DESC"]];
    }

    // --------------------------------------
    // FETCH DATA
    // --------------------------------------
    const roomTypesRaw = await RoomType.findAll({
      where: whereConditions,
      limit,
      offset,
      order: orderClause,
      attributes: {
        exclude: ["created_at", "updated_at"],
      },
    });

    const roomTypes = roomTypesRaw.map((item) => {
      const data = item.toJSON();

      return {
        ...data,
        area_sqm_json: parseJSON(data.area_sqm_json, {}),
        area_sqft_json: parseJSON(data.area_sqft_json, {}),
        amenities_json: parseJSON(data.amenities_json, []),
        tags_json: parseJSON(data.tags_json, []),
        switch_json: parseJSON(data.switch_json, {}),
        media_image_paths: parseJSON(data.media_image_paths, []),
        media_json: parseJSON(data.media_json, {}),
        floor_plan_json: parseJSON(data.floor_plan_json, []),
        double_policy_json: parseJSON(data.double_policy_json, {}),
      };
    });

    return res.status(200).json({
      success: true,
      pagination: {
        current_page: page,
        total: totalCount,
        total_pages: Math.ceil(totalCount / limit),
      },
      filters_applied: req.query,
      data: roomTypes,
    });
  } catch (error) {
    console.error("Error fetching room types:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
