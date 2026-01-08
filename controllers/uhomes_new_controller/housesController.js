const { db } = require("../../models");
const sequelize = db.sequelize;
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

const { Op, Sequelize, literal, where } = require("sequelize");
const house_switchesModel = require("../../models/uhomes_new_Model/house_switchesModel");

const parseJSON = (value, defaultValue) => {
  try {
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

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

exports.getHousesList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const whereConditions = {};
    // const whereConditions = getBaseConditions();

    //Params by Find Houses

    if (req.query.country_unique_name) {
      whereConditions[Op.and] = whereConditions[Op.and] || [];
      whereConditions[Op.and].push({
        source_city_unique_name: req.query.city_unique_name,
      });
    }
    if (req.query.city_unique_name) {
      whereConditions[Op.and] = whereConditions[Op.and] || [];
      whereConditions[Op.and].push({
        source_country_unique_name: req.query.city_unique_name,
      });
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

    // FILTERS (BASIC IDS)
    if (req.query.city_id) whereConditions.city_id = req.query.city_id;
    if (req.query.state_id) whereConditions.state_id = req.query.state_id;
    if (req.query.country_id) whereConditions.country_id = req.query.country_id;
    if (req.query.house_status)
      whereConditions.house_status = parseInt(req.query.house_status);
    if (req.query.booking_status)
      whereConditions.booking_status = parseInt(req.query.booking_status);

    // Room Type
    if (req.query.has_room_types !== undefined) {
      whereConditions.has_room_types = req.query.has_room_types === "true";
    }

    // GLOBAL SEARCH (title, source city, source country, addresss)
    if (req.query.search) {
      const search = String(req.query.search).trim().toLowerCase();

      whereConditions[Op.and] = whereConditions[Op.and] || [];

      whereConditions[Op.and].push({
        [Op.or]: [
          // title
          Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("title")), {
            [Op.like]: `%${search}%`,
          }),

          // source city
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("source_city_unique_name")),
            { [Op.like]: `%${search}%` }
          ),

          // source country
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("source_country_unique_name")),
            { [Op.like]: `%${search}%` }
          ),
          // address (from raw_payload_json)
          Sequelize.where(
            Sequelize.fn(
              "LOWER",
              Sequelize.fn(
                "JSON_UNQUOTE",
                Sequelize.fn(
                  "JSON_EXTRACT",
                  Sequelize.col("raw_payload_json"),
                  "$.location.address"
                )
              )
            ),
            { [Op.like]: `%${search}%` }
          ),
          // school_name
          Sequelize.where(
            Sequelize.fn(
              "LOWER",
              Sequelize.fn(
                "JSON_UNQUOTE",
                Sequelize.fn(
                  "JSON_EXTRACT",
                  Sequelize.col("raw_payload_json"),
                  "$.school.school_name"
                )
              )
            )
          ),
        ],
      });
    }

    // UNIVERSITY FILTER
    if (req.query.university) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.fn(
            "LOWER",
            Sequelize.fn(
              "JSON_UNQUOTE",
              Sequelize.fn(
                "JSON_EXTRACT",
                Sequelize.col("raw_payload_json"),
                "$.school_info.school_name"
              )
            )
          ),
          { [Op.like]: `%${req.query.university}%` }
        )
      );
    }

    // tITLE FILTER
    if (req.query.title) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.fn("TRIM", Sequelize.col("title"))),
          { [Op.like]: `%${req.query.title}%` }
        )
      );
    }

    // City NAME FILTER
    if (req.query.city_name) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.fn(
            "LOWER",
            Sequelize.fn(
              "JSON_UNQUOTE",
              Sequelize.fn(
                "JSON_EXTRACT",
                Sequelize.col("raw_payload_json"),
                "$.city.city_name"
              )
            )
          ),
          { [Op.like]: `%${req.query.city_name.toLowerCase()}%` }
        )
      );
    }

    // Room Type FILTER
    if (req.query.room_type) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.fn(
            "LOWER",
            Sequelize.fn(
              "JSON_UNQUOTE",
              Sequelize.fn(
                "JSON_EXTRACT",
                Sequelize.col("raw_payload_json"),
                "$.room_types.room_type_items[*].name"
              )
            )
          ),
          { [Op.like]: `%${req.query.room_type.toLowerCase()}%` }
        )
      );
    }

    // Amenity FILTER
    if (req.query.amenities) {
      const amenities = req.query.amenities.split(",").map((a) => a.trim().toLowerCase());
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      amenities.forEach((amenity) => {
        whereConditions[Op.and].push(
          Sequelize.where(
            Sequelize.fn(
              "LOWER",
              Sequelize.fn(
                "JSON_UNQUOTE",
                Sequelize.fn(
                  "JSON_EXTRACT",
                  Sequelize.col("raw_payload_json"),
                  "$.amenities[*].name"
                )
              )
            ),
            { [Op.like]: `%${amenity}%` }
          )
        );
      });
    }

    // PRICE FILTER
    if (req.query.min_price || req.query.max_price) {
      whereConditions.rent_amount_value = {};
      if (req.query.min_price)
        whereConditions.rent_amount_value[Op.gte] = Number(req.query.min_price);
      if (req.query.max_price)
        whereConditions.rent_amount_value[Op.lte] = Number(req.query.max_price);
    }

    // SUPPLIER FILTER
    if (req.query.supplier) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.fn(
            "LOWER",
            Sequelize.fn(
              "JSON_UNQUOTE",
              Sequelize.fn(
                "JSON_EXTRACT",
                Sequelize.col("raw_payload_json"),
                "$.supplier.name"
              )
            )
          ),
          { [Op.like]: `%${req.query.supplier.toLowerCase()}%` }
        )
      );
    }

    // Booking STATUS FILTER
    if (req.query.booking_status) {
      whereConditions.booking_status = parseInt(req.query.booking_status);
    }

    // DATE FILTER
    if (req.query.start_date) {
      whereConditions.min_start_date = {
        [Op.lte]: req.query.start_date,
      };
    }

    const totalCount = await Houses.count({ where: whereConditions });

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
      .map((supplier, index) => {
        return `WHEN JSON_UNQUOTE(JSON_EXTRACT(raw_payload_json, '$.supplier.name')) = '${supplier}' THEN ${
          index + 1
        }`;
      })
      .join(" ");

    const orderClause = [
      [
        Sequelize.literal(
          `CASE ${priorityCaseStatement} ELSE ${prioritySuppliers.length + 1} END`
        ),
        "ASC",
      ],
      ["favorite_count", "DESC"],
      ["created_at", "DESC"],
    ];

    if (req.query.sort === "low_to_high") {
      orderClause.push(["rent_amount_value", "ASC"]);
    } else if (req.query.sort === "high_to_low") {
      orderClause.push(["rent_amount_value", "DESC"]);
    } else if (req.query.sort === "latest") {
      orderClause.push(["created_at", "DESC"]);
    } else {
      // orderClause.push(Sequelize.literal("RAND()"));
      orderClause.push(["created_at", "DESC"]);
    }

    const housesData = await Houses.findAll({
      where: whereConditions,
      limit,
      offset,
      order: orderClause,
      attributes: {
        // exclude: [
        //   "raw_payload_json",
        //   "raw_room_type_payload",
        //   "raw_room_type_payload_json",
        // ],
      },
    });

    const responseData = housesData.map((house) => ({
      house_id: house.house_id,
      title: house.title,
      lease_unit: house.lease_unit,
      source_city_unique_name: house.source_city_unique_name,
      source_country_unique_name: house.source_country_unique_name,
      rent_amount_value: house.rent_amount_value,
      rent_amount_abbr: house.rent_amount_abbr,
      promo_price_value: house.promo_price_value,
      promo_price_abbr: house.promo_price_abbr,
      original_price_value: house.original_price_value,
      original_price_abbr: house.original_price_abbr,
      min_start_date: house.min_start_date,
      booking_status: house.booking_status,
      house_url: house.house_url,
      bed_num: house.bed_num,
      media_image_paths: house.media_image_paths,
      city_id: house.city_id,
      state_id: house.state_id,
      country_id: house.country_id,
      house_status: house.house_status,
      total_floor: house.total_floor,
      room_type_count: house.room_type_count,
      rawJson: transformHouseListData(house),
    }));

    return res.status(200).json({
      success: true,
      pagination: {
        current_page: page,
        total: totalCount,
        total_pages: Math.ceil(totalCount / limit),
      },
      filters_applied: req.query,
      house: responseData,
    });
  } catch (error) {
    console.error("Error fetching houses list:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllHouses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const whereConditions = {};
    // const whereConditions = getBaseConditions();

    // FILTERS (BASIC IDS)
    if (req.query.city_id) whereConditions.city_id = req.query.city_id;
    if (req.query.state_id) whereConditions.state_id = req.query.state_id;
    if (req.query.country_id) whereConditions.country_id = req.query.country_id;
    if (req.query.house_status)
      whereConditions.house_status = parseInt(req.query.house_status);
    if (req.query.booking_status)
      whereConditions.booking_status = parseInt(req.query.booking_status);

    if (req.query.has_room_types !== undefined) {
      whereConditions.has_room_types = req.query.has_room_types === "true";
    }

    // GLOBAL SEARCH (title, source city, source country, addresss)
    if (req.query.search) {
      const search = String(req.query.search).trim().toLowerCase();

      whereConditions[Op.and] = whereConditions[Op.and] || [];

      whereConditions[Op.and].push({
        [Op.or]: [
          // title
          Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("title")), {
            [Op.like]: `%${search}%`,
          }),

          // source city
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("source_city_unique_name")),
            { [Op.like]: `%${search}%` }
          ),

          // source country
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("source_country_unique_name")),
            { [Op.like]: `%${search}%` }
          ),
          // address (from raw_payload_json)
          Sequelize.where(
            Sequelize.fn(
              "LOWER",
              Sequelize.fn(
                "JSON_UNQUOTE",
                Sequelize.fn(
                  "JSON_EXTRACT",
                  Sequelize.col("raw_payload_json"),
                  "$.location.address"
                )
              )
            ),
            { [Op.like]: `%${search}%` }
          ),
        ],
      });
    }

    // UNIVERSITY FILTER
    if (req.query.university) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.fn(
            "LOWER",
            Sequelize.fn(
              "JSON_UNQUOTE",
              Sequelize.fn(
                "JSON_EXTRACT",
                Sequelize.col("raw_payload_json"),
                "$.school_info.school_name"
              )
            )
          ),
          { [Op.like]: `%${req.query.university}%` }
        )
      );
    }

    // tITLE FILTER
    if (req.query.title) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.fn("TRIM", Sequelize.col("title"))),
          { [Op.like]: `%${req.query.title}%` }
        )
      );
    }

    // City NAME FILTER
    if (req.query.city_name) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.fn(
            "LOWER",
            Sequelize.fn(
              "JSON_UNQUOTE",
              Sequelize.fn(
                "JSON_EXTRACT",
                Sequelize.col("raw_payload_json"),
                "$.city.city_name"
              )
            )
          ),
          { [Op.like]: `%${req.query.city_name.toLowerCase()}%` }
        )
      );
    }

    // Room Type FILTER
    if (req.query.room_type) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.fn(
            "LOWER",
            Sequelize.fn(
              "JSON_UNQUOTE",
              Sequelize.fn(
                "JSON_EXTRACT",
                Sequelize.col("raw_payload_json"),
                "$.room_types.room_type_items[*].name"
              )
            )
          ),
          { [Op.like]: `%${req.query.room_type.toLowerCase()}%` }
        )
      );
    }

    // Amenity FILTER
    if (req.query.amenities) {
      const amenities = req.query.amenities.split(",").map((a) => a.trim().toLowerCase());
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      amenities.forEach((amenity) => {
        whereConditions[Op.and].push(
          Sequelize.where(
            Sequelize.fn(
              "LOWER",
              Sequelize.fn(
                "JSON_UNQUOTE",
                Sequelize.fn(
                  "JSON_EXTRACT",
                  Sequelize.col("raw_payload_json"),
                  "$.amenities[*].name"
                )
              )
            ),
            { [Op.like]: `%${amenity}%` }
          )
        );
      });
    }

    // PRICE FILTER
    if (req.query.min_price || req.query.max_price) {
      whereConditions.rent_amount_value = {};
      if (req.query.min_price)
        whereConditions.rent_amount_value[Op.gte] = Number(req.query.min_price);
      if (req.query.max_price)
        whereConditions.rent_amount_value[Op.lte] = Number(req.query.max_price);
    }

    // SUPPLIER FILTER
    if (req.query.supplier) {
      if (!whereConditions[Op.and]) whereConditions[Op.and] = [];
      whereConditions[Op.and].push(
        Sequelize.where(
          Sequelize.fn(
            "LOWER",
            Sequelize.fn(
              "JSON_UNQUOTE",
              Sequelize.fn(
                "JSON_EXTRACT",
                Sequelize.col("raw_payload_json"),
                "$.supplier.name"
              )
            )
          ),
          { [Op.like]: `%${req.query.supplier.toLowerCase()}%` }
        )
      );
    }

    // Booking STATUS FILTER
    if (req.query.booking_status) {
      whereConditions.booking_status = parseInt(req.query.booking_status);
    }

    // DATE FILTER
    if (req.query.start_date) {
      whereConditions.min_start_date = {
        [Op.lte]: req.query.start_date,
      };
    }

    // COUNT TOTAL
    const totalCount = await Houses.count({ where: whereConditions });

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
      .map((supplier, index) => {
        return `WHEN JSON_UNQUOTE(JSON_EXTRACT(raw_payload_json, '$.supplier.name')) = '${supplier}' THEN ${
          index + 1
        }`;
      })
      .join(" ");

    // SORTING
    // const orderClause = [
    //   [
    //     Sequelize.literal(
    //       `CASE ${priorityCaseStatement} ELSE ${prioritySuppliers.length + 1} END`
    //     ),
    //     "ASC",
    //   ],
    //   // ["house_id", "DESC"],
    //   ["favorite_count", "DESC"],
    // ];

    const orderClause = [
      [
        Sequelize.literal(
          `CASE ${priorityCaseStatement} ELSE ${prioritySuppliers.length + 1} END`
        ),
        "ASC",
      ],
      ["favorite_count", "DESC"],
      ["created_at", "DESC"],
    ];

    if (req.query.sort === "low_to_high") {
      orderClause.push(["rent_amount_value", "ASC"]);
    } else if (req.query.sort === "high_to_low") {
      orderClause.push(["rent_amount_value", "DESC"]);
    } else if (req.query.sort === "latest") {
      orderClause.push(["created_at", "DESC"]);
    } else {
      // orderClause.push(Sequelize.literal("RAND()"));
      orderClause.push(["created_at", "DESC"]);
    }

    // FETCH DATA
    const housesData = await Houses.findAll({
      where: whereConditions,
      limit,
      offset,
      order: orderClause,
      attributes: {
        // exclude: [
        //   "raw_payload_json",
        //   "raw_room_type_payload",
        //   "raw_room_type_payload_json",
        // ],
      },
    });

    // const housesData = await Houses.findAll({
    //   where: whereConditions,
    //   limit,
    //   offset,
    //   order: orderClause,
    // });

    // const responseData = housesData.map((item) => {
    //   const row = item.toJSON();

    //   // Parse raw_payload_json if stored as string
    //   row.raw_payload_json = parseJSON(row.raw_payload_json, {});

    //   return transformHouseData(row);
    // });

    // return res.send(responseData);

    const rawHousesData = housesData.map((house) => ({
      house_id: house.house_id,
      sku: house.sku,
      type_id: house.type_id,
      sub_type_id: house.sub_type_id,
      sub_type: house.sub_type,
      cust_id: house.cust_id,
      supplier_id: house.supplier_id,
      city_id: house.city_id,
      state_id: house.state_id,
      country_id: house.country_id,
      house_status: house.house_status,
      publish_type: house.publish_type,
      has_sublease: house.has_sublease,
      title: house.title,
      booking_status: house.booking_status,
      favorite_count: house.favorite_count,
      lease_unit: house.lease_unit,
      rent_amount_value: house.rent_amount_value,
      rent_amount_abbr: house.rent_amount_abbr,
      promo_price_value: house.promo_price_value,
      promo_price_abbr: house.promo_price_abbr,
      original_price_value: house.original_price_value,
      original_price_abbr: house.original_price_abbr,
      min_start_date: house.min_start_date,
      house_url: house.house_url,
      ranking: house.ranking,
      supplier_logo: house.supplier_logo,
      bed_num: house.bed_num,
      total_floor: house.total_floor,
      room_type_count: house.room_type_count,
      hasReleased: house.hasReleased,
      media_image_paths: house.media_image_paths,
      source_city_unique_name: house.source_city_unique_name,
      source_country_unique_name: house.source_country_unique_name,
      room_types_done: house.room_types_done,
      room_types_updated_at: house.room_types_updated_at,
      raw_room_type_payload: house.raw_room_type_payload,
      has_room_types: house.has_room_types,
      room_type_payload: house.room_type_payload,
      room_types_status: house.room_types_status,
      room_types_worker: house.room_types_worker,
      room_types_attempts: house.room_types_attempts,
      room_types_last_error: house.room_types_last_error,
      created_at: house.created_at,
      updated_at: house.updated_at,
      rawJson: transformHouseData1(house),
    }));

    return res.status(200).json({
      success: true,
      pagination: {
        current_page: page,
        total: totalCount,
        total_pages: Math.ceil(totalCount / limit),
      },
      filters_applied: req.query,
      house: rawHousesData,
    });
  } catch (error) {
    console.error("Error fetching houses:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getHouseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "House ID is required",
      });
    }

    const house = await Houses.findOne({
      where: {
        house_id: id,
      },
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
      raw: false,
    });

    if (!house) {
      return res.status(404).json({
        success: false,
        message: "House not found by ID",
      });
    }

    const housePlain = house.get({ plain: true });
    // OR: const housePlain = house.toJSON();

    // Map response exactly like getAllHouses
    const houseData = {
      house_id: house.house_id,
      sku: house.sku,
      type_id: house.type_id,
      sub_type_id: house.sub_type_id,
      sub_type: house.sub_type,
      cust_id: house.cust_id,
      supplier_id: house.supplier_id,
      city_id: house.city_id,
      state_id: house.state_id,
      country_id: house.country_id,
      house_status: house.house_status,
      publish_type: house.publish_type,
      has_sublease: house.has_sublease,
      title: house.title,
      booking_status: house.booking_status,
      favorite_count: house.favorite_count,
      lease_unit: house.lease_unit,
      rent_amount_value: house.rent_amount_value,
      rent_amount_abbr: house.rent_amount_abbr,
      promo_price_value: house.promo_price_value,
      promo_price_abbr: house.promo_price_abbr,
      original_price_value: house.original_price_value,
      original_price_abbr: house.original_price_abbr,
      min_start_date: house.min_start_date,
      house_url: house.house_url,
      ranking: house.ranking,
      supplier_logo: house.supplier_logo,
      bed_num: house.bed_num,
      total_floor: house.total_floor,
      room_type_count: house.room_type_count,
      hasReleased: house.hasReleased,
      media_image_paths: house.media_image_paths,
      source_city_unique_name: house.source_city_unique_name,
      source_country_unique_name: house.source_country_unique_name,
      room_types_done: house.room_types_done,
      room_types_updated_at: house.room_types_updated_at,
      raw_room_type_payload: house.raw_room_type_payload,
      has_room_types: house.has_room_types,
      room_type_payload: house.room_type_payload,
      room_types_status: house.room_types_status,
      room_types_worker: house.room_types_worker,
      room_types_attempts: house.room_types_attempts,
      room_types_last_error: house.room_types_last_error,
      created_at: house.created_at,
      updated_at: house.updated_at,

      keyAmenities: house.house_amenities,
      advisorDetails: house.house_advisors,
      locationDetails: house.house_locations,
      navigateDetails: house.house_navigate,
      schoolDetails: house.house_schools,
      serviceTags: house.house_service_tags,
      houseSwitches: house.house_switches,
      houseTags: house.house_tags,
      houseTips: house.house_tips,
      houseRoomTypes: house.house_room_types,
      roomTypeTenancies: house.room_type_tenancies,
      schoolTraffic: house.school_traffic,

      // Same transformation used in listing API
      rawJson: transformHouseData1(house),
    };

    return res.status(200).json({
      success: true,
      house: houseData,
      message: "House retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching house by ID:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getGlobalHouseSearch = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim().toLowerCase;

    const titles = await Houses.findAll({
      attributes: [
        "title",
        "source_city_unique_name",
        "source_country_unique_name",
        [(sequelize.fn("COUNT", sequelize.col("id")), "property_count")],
      ],
      where: {
        is_active: true,
        title: { [Op.ne]: null },
        [Op.and]: Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("title")), {
          [Op.like]: `%${search}%`,
        }),
      },
      group: ["title", "source_city_unique_name", "source_country_unique_name"],
      raw: true,
    });

    
  } catch (error) {
    console.error("Global search error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getHouseAmenitiesById = async (req, res) => {
  try {
    const { id } = req.params;

    const amenity = await house_amenities.findOne({
      where: { house_id: id },
    });

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "House Amenities not found By ID",
      });
    }

    return res.status(200).json({
      success: true,
      data: amenity,
      message: "House Amenities retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching House Amenities:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getHouseAdvisorsById = async (req, res) => {
  try {
    const { id } = req.params;
    const advisor = await db.house_advisors.findOne({
      where: { house_id: id },
    });
    if (!advisor) {
      return res.status(404).json({
        success: false,
        message: "House Advisor not found By ID",
      });
    }
    return res.status(200).json({
      success: true,
      data: advisor,
      message: "House Advisor retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching House Advisor:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getHouseLocationsById = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await db.house_locations.findOne({
      where: { house_id: id },
    });
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "House Location not found By ID",
      });
    }

    return res.status(200).json({
      success: true,
      data: location,
      message: "House Location retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching House Location:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getHouseNavigateById = async (req, res) => {
  try {
    const { id } = req.params;
    const navigate = await db.house_navigate.findOne({
      where: { house_id: id },
    });
    if (!navigate) {
      return res.status(404).json({
        success: false,
        message: "House Navigate not found By ID",
      });
    }
    return res.status(200).json({
      success: true,
      data: navigate,
      message: "House Navigate retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching House Navigate:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getHouse_room_typesById = async (req, res) => {
  try {
    const { id } = req.params;
    const house_room_types = await db.house_room_types.findOne({
      where: { house_id: id },
    });
    if (!house_room_types) {
      return res.status(404).json({
        success: false,
        message: "House Room Types not found By ID",
      });
    }
    return res.status(200).json({
      success: true,
      data: house_room_types,
      message: "House Room Types retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching House Room Types:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getHouseSchoolsById = async (req, res) => {
  try {
    const { id } = req.params;
    const house_schools = await db.house_schools.findOne({
      where: { house_id: id },
    });
    if (!house_schools) {
      return res.status(404).json({
        success: false,
        message: "House Schools not found By ID",
      });
    }
    return res.status(200).json({
      success: true,
      data: house_schools,
      message: "House Schools retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching House Schools:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getHouseServiceTagsById = async (req, res) => {
  try {
    const { id } = req.params;
    const house_service_tags = await db.house_service_tags.findOne({
      where: { house_id: id },
    });
    if (!house_service_tags) {
      return res.status(404).json({
        success: false,
        message: "House Service Tags not found By ID",
      });
    }
    return res.status(200).json({
      success: true,
      data: house_service_tags,
      message: "House Service Tags retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching House Service Tags:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getHouseSwitchesById = async (req, res) => {
  try {
    const { id } = req.params;
    const house_switches = await db.house_switches.findOne({
      where: { house_id: id },
    });
    if (!house_switches) {
      return res.status(404).json({
        success: false,
        message: "House Switches not found By ID",
      });
    }
    return res.status(200).json({
      success: true,
      data: house_switches,
      message: "House Switches retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching House Switches:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getHouseTagsById = async (req, res) => {
  try {
    const { id } = req.params;
    const house_tags = await db.house_tags.findOne({
      where: { house_id: id },
    });
    if (!house_tags) {
      return res.status(404).json({
        success: false,
        message: "House Tags not found By ID",
      });
    }
    return res.status(200).json({
      success: true,
      data: house_tags,
      message: "House Tags retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching House Tags:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getHouseTipsById = async (req, res) => {
  try {
    const { id } = req.params;
    const house_tips = await db.house_tips.findOne({
      where: { house_id: id },
    });
    if (!house_tips) {
      return res.status(404).json({
        success: false,
        message: "House Tips not found By ID",
      });
    }
    return res.status(200).json({
      success: true,
      data: house_tips,
      message: "House Tips retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching House Tips:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getRoom_type_tenanciesById = async (req, res) => {
  try {
    const { id } = req.params;
    const room_type_tenancies = await db.room_type_tenancies.findOne({
      where: { house_id: id },
    });
    if (!room_type_tenancies) {
      return res.status(404).json({
        success: false,
        message: "Room Type Tenancies not found By ID",
      });
    }
    return res.status(200).json({
      success: true,
      data: room_type_tenancies,
      message: "Room Type Tenancies retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching Room Type Tenancies:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getSchoolTrafficById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_traffic = await db.school_traffic.findOne({
      where: { house_id: id },
    });
    if (!school_traffic) {
      return res.status(404).json({
        success: false,
        message: "School Traffic not found By ID",
      });
    }
    return res.status(200).json({
      success: true,
      data: school_traffic,
      message: "School Traffic retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching School Traffic:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const transformHouseListData = (house) => {
  const payload = house.raw_payload_json || {};
  return {
    amenities: (payload?.amenities || []).map((a) => a.name),
    roomTypes: (payload?.room_types?.room_type_items || []).map((room) => ({
      name: room.name,
      price: room.price,
      leaseUnit: room.lease_unit,
      currency: room?.rent_amount?.currency,
    })),
    tags: (payload?.tags || []).map((t) => t.name),
    school: payload?.school || null,
    reviews: payload?.reviews || null,
    supplier: {
      logo: payload?.supplier?.logo || null,
      name: payload?.supplier?.name || null,
      originated: payload?.supplier?.originated || null,
      sub_type_id: payload?.supplier?.sub_type_id || null,
    },
    contacts: payload?.contacts || null,
    rent: {
      amount: payload?.house?.rent_amount?.amount || 0,
      currency: payload?.house?.rent_amount?.abbr || null,
      leaseUnit: payload?.house?.lease_unit || null,
    },
  };
};

const transformHouseData1 = (house) => {
  const payload = house.raw_payload_json || {};
  return {
    tips: {
      distance: payload?.tips?.distance || null,
      sub_type: payload?.tips?.sub_type || null,
      available_room: payload?.tips?.available_room || null,
      top_picks_rank: payload?.tips?.top_picks_rank || null,
      exclusive_offer: {
        desc: payload?.tips?.exclusive_offer?.desc || null,
        remain_time: payload?.tips?.exclusive_offer?.remain_time || null,
        expired_time: payload?.tips?.exclusive_offer?.expired_time || null,
        offer_amount: payload?.tips?.exclusive_offer?.offer_amount || null,
        is_exclusive_offer: payload?.tips?.exclusive_offer?.is_exclusive_offer || null,
      },
      ten_anniversary: payload?.tips?.ten_anniversary || null,
      is_show_available_room: payload?.tips?.is_show_available_room || null,
    },
    school: payload?.school || null,
    images: (payload?.media?.images || []).map((img) => img?.media_img?.legacy_url),
    amenities: (payload?.amenities || []).map((a) => a.name),
    tags: (payload?.tags || []).map((t) => t.name),
    roomTypes: (payload?.room_types?.room_type_items || []).map((room) => ({
      name: room.name,
      price: room.price,
      leaseUnit: room.lease_unit,
      currency: room?.rent_amount?.currency,
    })),
    advisor: payload?.advisor || null,
    rent: {
      amount: payload?.house?.rent_amount?.amount || 0,
      currency: payload?.house?.rent_amount?.abbr || null,
      leaseUnit: payload?.house?.lease_unit || null,
    },
    supplier: {
      logo: payload?.supplier?.logo || null,
      name: payload?.supplier?.name || null,
      originated: payload?.supplier?.originated || null,
      sub_type_id: payload?.supplier?.sub_type_id || null,
    },
    location: {
      lat: payload?.location?.lat,
      lng: payload?.location?.lat,
      address: payload?.location?.lat,
      zipcode: payload?.location?.lat,
      place_id: payload?.location?.lat,
      street_view_lat: payload?.location?.lat,
      street_view_lng: payload?.location?.lat,
    },
    city: {
      id: payload?.city?.city_id || null,
      city_name: payload?.city?.city_name || null,
      city_unique_name: payload?.city?.city_unique_name || null,
    },
    state: {
      state_id: payload?.state?.state_id || null,
      state_name: payload?.state?.state_name || null,
    },
    country: {
      ab: payload?.country?.ab || null,
      country_id: payload?.country?.country_id || null,
      country_name: payload?.country?.country_name || null,
      country_unique_name: payload?.country?.country_unique_name || null,
    },
    contacts: payload?.contacts || null,
    reviews: payload?.reviews || null,
    navigate: payload?.navigate || null,
    createdAt: house.createdAt,
    updatedAt: house.updatedAt,
  };
};

const transformHouseData2 = (row) => {
  const raw = row.raw_payload_json || {};
  const house = raw.house || {};
  const city = raw.city || {};
  const country = raw.country || {};
  const location = raw.location || {};
  const supplier = raw.supplier || {};
  const media = row.media || {};
  const school = raw.school || {};

  // Transform images with proper null checks
  const processedImages = (media.images || [])
    .map((imgObj) => {
      try {
        if (imgObj && imgObj.media_img) {
          const { path, suffix, legacy_url } = imgObj.media_img;

          // Case 1: When path exists (new CDN format)
          if (path) {
            const suffixKey = suffix?.includes("g") ? "_g" : "_h";
            return `https://media.uhzcdn.com/${path.replace(
              ".webp",
              ""
            )}${suffixKey}.webp`;
          }

          // Case 2: When legacy_url exists (old image format)
          if (legacy_url) {
            return legacy_url;
          }
        }
        return null;
      } catch (error) {
        console.warn("Error processing image:", error.message);
        return null;
      }
    })
    .filter(Boolean); // remove null values

  return {
    house_id: row.house_id,
    title: row.title,

    city_name: city.city_name || null,
    address: location.address || null,
    lat: location.lat || null,
    lng: location.lng || null,

    rent_amount: house?.rent_amount?.amount ?? null,
    rent_currency: house?.rent_amount?.abbr ?? null,

    promo_price: house?.promo_price?.amount ?? null,
    original_price: house?.original_price?.amount ?? null,

    lease_unit: house.lease_unit || null,

    images: processedImages,

    amenities: raw.amenities || [],
    room_types: raw.room_types?.room_type_items || [],
    tags: raw.tags || [],

    school_info: school || null,
    reviews: raw.reviews,
    contacts: raw.contacts,

    supplier_name: supplier.name || null,

    bed_num: house.bed_num ?? 0,
    total_floor: house.total_floor ?? 0,
    favorite_count: house.favorite_count ?? 0,

    booking_status: house.booking_status ?? null,
    min_start_date: house.min_start_date ?? null,

    country: country.country_name || null,
    city: city.city_name || null,

    is_active: row.house_status === 2, // active logic
  };
};

// new
exports.globalSearchApi = async (req, res) => {
  try {
    const search = String(req.query.search || "")
      .trim()
      .toLowerCase();

    /* ---------------- TITLE SEARCH ---------------- */
    const titles = await Property.findAll({
      attributes: [
        "title",
        "city_name",
        "country",
        [sequelize.fn("COUNT", sequelize.col("id")), "property_count"],
      ],
      where: {
        is_active: true,
        title: { [Op.ne]: null },
        [Op.and]: Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("title")), {
          [Op.like]: `%${search}%`,
        }),
      },
      group: ["title", "city_name", "country"],
      raw: true,
    });

    /* ---------------- UNIVERSITY SEARCH ---------------- */
    const universities = await Property.findAll({
      attributes: [
        [
          Sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(school_info, '$.school_name'))"),
          "university_name",
        ],
        "city_name",
        "country",
        [sequelize.fn("COUNT", sequelize.col("id")), "property_count"],
      ],
      where: {
        is_active: true,
        school_info: { [Op.ne]: null },
        [Op.and]: Sequelize.where(
          Sequelize.fn(
            "LOWER",
            Sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(school_info, '$.school_name'))")
          ),
          { [Op.like]: `%${search}%` }
        ),
      },
      group: [
        Sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(school_info, '$.school_name'))"),
        "city_name",
        "country",
      ],
      raw: true,
    });

    /* ---------------- CITY SEARCH ---------------- */
    const cities = await Property.findAll({
      attributes: [
        "city_name",
        "country",
        [sequelize.fn("COUNT", sequelize.col("id")), "property_count"],
      ],
      where: {
        is_active: true,
        city_name: { [Op.ne]: null },
        [Op.and]: Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("city_name")), {
          [Op.like]: `%${search}%`,
        }),
      },
      group: ["city_name", "country"],
      raw: true,
    });

    /* ---------------- RESPONSE ---------------- */
    return res.status(200).json({
      success: true,
      message: "Search results retrieved successfully",
      data: {
        cities: cities.map((c) => ({
          city_name: c.city_name,
          country: {
            country_name: c.country?.country_name ?? null,
            country_unique_name: c.country?.country_unique_name ?? null,
          },
          property_count: Number(c.property_count || 0),
        })),

        universities: universities.map((u) => ({
          university_name: u.university_name,
          city_name: u.city_name,
          country: {
            country_name: u.country?.country_name ?? null,
            country_unique_name: u.country?.country_unique_name ?? null,
          },
          property_count: Number(u.property_count || 0),
        })),

        titles: titles.map((t) => ({
          title: t.title,
          city_name: t.city_name,
          country: {
            country_name: t.country?.country_name ?? null,
            country_unique_name: t.country?.country_unique_name ?? null,
          },
          property_count: Number(t.property_count || 0),
        })),
      },
    });
  } catch (error) {
    console.error("Global search error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

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
