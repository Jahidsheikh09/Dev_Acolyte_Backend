// module.exports = (sequelize, Sequelize) => {
//   const HouseMedia = sequelize.define(
//     "house_media",
//     {
//       id: {
//         type: Sequelize.INTEGER,
//         primaryKey: true,
//         autoIncrement: true,
//       },
//       house_id: {
//         type: Sequelize.INTEGER,
//         allowNull: false,
//         references: {
//           model: "house", // Name of your house table
//           key: "house_id", // Primary key in the house table
//         },
//         onDelete: "CASCADE",
//       },
//       category: {
//         type: Sequelize.STRING, // e.g., "Featured", "Video", "Floor Plan", "Exterior", etc.
//         allowNull: false,
//       },
//       description: {
//         type: Sequelize.STRING,
//         allowNull: true,
//       },
//       media_type: {
//         type: Sequelize.STRING, // e.g., "image", "video", "vr", "live", etc.
//         allowNull: false,
//       },
//       media_url: {
//         type: Sequelize.STRING,
//         allowNull: false,
//       },
//       thumbnail_url: {
//         type: Sequelize.STRING,
//         allowNull: true,
//       },
//       sort_order: {
//         type: Sequelize.INTEGER,
//         defaultValue: 0,
//       },
//       unit_id: {
//         type: Sequelize.INTEGER,
//         allowNull: true,
//       },
//       source_type: {
//         type: Sequelize.INTEGER,
//         allowNull: true, // 1 = uhomes, 2 = landlord, 3 = tenant
//       },
//       available: {
//         type: Sequelize.INTEGER,
//       },
//     },
//     {
//       timestamps: true,
//       freezeTableName: true,
//       tableName: "house_media",
//     }
//   );

//   return HouseMedia;
// };
module.exports = (sequelize, Sequelize) => {
  const HouseMedia = sequelize.define(
    "house_media",
    {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      house_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "house", // Name of your house table
          key: "house_id", // Primary key in the house table
        },
        onDelete: "CASCADE",
      },

      /* -------- Classification -------- */
      media_type: {
        type: Sequelize.STRING, // image | video | vr | live
        allowNull: false,
        index: true,
      },

      source_type: {
        type: Sequelize.INTEGER, // 1=uhomes, 2=landlord, 3=tenant
        allowNull: true,
        index: true,
      },

      category_name: {
        type: Sequelize.STRING, // Featured, Exterior, Floor Plans
        allowNull: true,
        index: true,
      },

      category_type: {
        type: Sequelize.STRING, // featured, image_type_1, floor_plan
        allowNull: true,
      },

      /* -------- Media -------- */
      media_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      thumbnail_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      /* -------- Ordering & Scope -------- */
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },

      unit_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        index: true,
      },

      is_cover: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      /* -------- Raw JSON (future-proof) -------- */
      raw_json: {
        type: Sequelize.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "house_media",
      timestamps: true,
      indexes: [
        { fields: ["house_id"] },
        { fields: ["media_type"] },
        { fields: ["category_name"] },
        { fields: ["unit_id"] },
      ],
    }
  );

  return HouseMedia;
};
