const { db } = require("../models");
const path = require("path");
const { Op, Sequelize } = require("sequelize");
const Property = db.properties;

const uhomesCities = require(path.join(__dirname, "../city.json"));
const uhomesCountry = require(path.join(__dirname, "../country.json"));

// ✅ whitelist (must match your normalized city strings)
// const CITY_WHITELIST = new Set(
// 	[
// 		"berlin",
// 		"birmingham",
// 		"bologna",
// 		"cardiff",
// 		"coventry",
// 		"florence",
// 		"frankfurt am main",
// 		"glasgow",
// 		"leeds",
// 		"liverpool",
// 		"london",
// 		"manchester",
// 		"milan",
// 		"munich",
// 		"rome",
// 		"sheffield",
// 		"turin",
// 	].map((c) => c.toLowerCase().trim())
// );

const getCityWhitelistFromDB = async () => {
  const rows = await Property.findAll({
    attributes: [[Sequelize.fn("LOWER", Sequelize.col("city_name")), "city_name"]],
    group: [Sequelize.fn("LOWER", Sequelize.col("city_name"))],
    order: [[Sequelize.fn("LOWER", Sequelize.col("city_name")), "ASC"]],
    raw: true,
  });

  return new Set(rows.map((r) => String(r.city_name || "").trim()).filter(Boolean));
};

const toTitleCase = (str = "") =>
  str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// SQL expression: normalize rent to weekly
const weeklyRentExpr = Sequelize.literal(`
  CASE
    WHEN lease_unit = 'WEEK' THEN CAST(NULLIF(rent_amount,'') AS DECIMAL(18,6))
    WHEN lease_unit = 'DAY' THEN CAST(NULLIF(rent_amount,'') AS DECIMAL(18,6)) * 7
    WHEN lease_unit = 'MONTH' THEN CAST(NULLIF(rent_amount,'') AS DECIMAL(18,6)) * (12/52)
    ELSE NULL
  END
`);

exports.getCountryAndCities = async (req, res) => {
  try {
    const CITY_WHITELIST = await getCityWhitelistFromDB();
    // countryCode -> [citySlug, ...]
    const countryCityMap = uhomesCities.reduce((acc, item) => {
      const cc = String(item.countryCode || "")
        .toLowerCase()
        .trim();
      const city = String(item.cityName || "")
        .toLowerCase()
        .trim();
      if (!cc || !city) return acc;
      if (!acc[cc]) acc[cc] = [];

      const normalizedCity = city.split("-").join(" ").toLowerCase();

      // ✅ only keep whitelisted cities
      if (CITY_WHITELIST.has(normalizedCity)) {
        acc[cc].push(normalizedCity);
      }

      return acc;
    }, {});

    // citySlug -> countryCode (reverse map)
    const cityToCountry = uhomesCities.reduce((acc, item) => {
      const cc = String(item.countryCode || "")
        .toLowerCase()
        .trim();
      const city = String(item.cityName || "")
        .toLowerCase()
        .trim();
      if (!cc || !city) return acc;
      acc[city] = cc;
      return acc;
    }, {});
    // 1) Aggregate per (city, currency)
    const cityAgg = await Property.findAll({
      attributes: [
        [Sequelize.fn("LOWER", Sequelize.col("city_name")), "city_key"],
        [Sequelize.fn("UPPER", Sequelize.col("rent_currency")), "currency"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "propertyCount"],
        [Sequelize.fn("AVG", weeklyRentExpr), "avgWeeklyRent"],
        [Sequelize.fn("MIN", weeklyRentExpr), "minWeeklyRent"],
      ],
      where: {
        is_active: true,
        lease_unit: { [Op.in]: ["WEEK", "DAY", "MONTH"] },
        rent_currency: { [Op.ne]: null },

        // ✅ whitelist filter at DB level
        city_name: {
          [Op.in]: Array.from(CITY_WHITELIST),
        },

        // ✅ exclude '' and 0
        rent_amount: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: "" },
            Sequelize.where(
              Sequelize.cast(Sequelize.col("rent_amount"), "DECIMAL(18,6)"),
              { [Op.gt]: 0 }
            ),
          ],
        },
      },
      group: [
        Sequelize.fn("LOWER", Sequelize.col("city_name")),
        Sequelize.fn("UPPER", Sequelize.col("rent_currency")),
      ],
      raw: true,
    });

    /**
     * 2) Roll-up to country+currency stats
     */
    const stats = {};

    for (const row of cityAgg) {
      const cityKey = String(row.city_key || "")
        .toLowerCase()
        .trim();

      // ✅ safety: ignore non-whitelisted cities (in case DB has mixed formatting)
      if (!CITY_WHITELIST.has(cityKey)) continue;

      const currency = String(row.currency || "")
        .toUpperCase()
        .trim();
      const cc = cityToCountry[cityKey];

      if (!cc || !currency) continue;

      const cnt = Number(row.propertyCount || 0);
      const avg = row.avgWeeklyRent === null ? null : Number(row.avgWeeklyRent);
      const min = row.minWeeklyRent === null ? null : Number(row.minWeeklyRent);

      if (!cnt || avg === null) continue;

      if (!stats[cc]) stats[cc] = {};
      if (!stats[cc][currency]) {
        stats[cc][currency] = { totalCount: 0, sumWeekly: 0, minWeekly: null };
      }

      const bucket = stats[cc][currency];
      bucket.totalCount += cnt;
      bucket.sumWeekly += avg * cnt;

      if (min !== null) {
        bucket.minWeekly =
          bucket.minWeekly === null ? min : Math.min(bucket.minWeekly, min);
      }
    }

    // 3) Build response (countries without whitelisted cities get ignored)
    const data = uhomesCountry
      .map((country) => {
        const code = String(country.unique_name || "")
          .toLowerCase()
          .trim();

        // ✅ only whitelisted cities per country
        const cities = (countryCityMap[code] || []).map(toTitleCase);
        if (!cities.length) return null;

        const currencyBuckets = stats[code] || {};

        // pick currency with max propertyCount
        let chosenCurrency = null;
        let chosen = null;

        for (const [cur, b] of Object.entries(currencyBuckets)) {
          if (!chosen || b.totalCount > chosen.totalCount) {
            chosenCurrency = cur;
            chosen = b;
          }
        }

        const averageRent =
          chosen && chosen.totalCount > 0 ? chosen.sumWeekly / chosen.totalCount : null;

        return {
          name: country.name,
          unique_name: country.unique_name,
          cities,
          currencyName: chosenCurrency,
          leastRent: chosen ? chosen.minWeekly : null,
          averageRent: averageRent === null ? null : Math.floor(Number(averageRent)),
          propertyCount: chosen ? chosen.totalCount : 0,
          rentUnit: "WEEK",
        };
      })
      .filter((c) => c && (c.propertyCount || 0) > 0);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getCountryAndCities error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};
