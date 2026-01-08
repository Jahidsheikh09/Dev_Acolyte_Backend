module.exports = {
  db: {
    HOST: process.env.DB_HOST,
    USER: process.env.DB_USERNAME,
    PASSWORD: process.env.DB_PASSWORD,
    DB: process.env.DB_NAME,
    PORT: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    pool: {
      port: 5433,
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000,
      evict: 1000,
    },
    dialectOptions: {
      connectTimeout: 60000, // Connection timeout
      acquireTimeout: 60000, // Acquire timeout
      timeout: 60000, // Query timeout
    },
  },
};
