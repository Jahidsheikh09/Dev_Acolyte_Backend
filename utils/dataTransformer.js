// utils/dataTransformer.js
const transformPropertyData = (rawData) => {
  console.log("Starting data transformation...");
  if (!rawData || !Array.isArray(rawData)) return [];
  const transformedProperties = [];

  rawData.forEach((item) => {
    if (
      (item.decrypted_data && item.decrypted_data.data) ||
      Array.isArray(item?.data?.data)
    ) {
      (item.decrypted_data?.data || item?.data?.data).forEach((property) => {
        const house = property.house || {};
        const location = property.location || {};
        const city = property.city || {};
        const countrie = property.country || {};
        const media = property.media || {};
        const school = property.school || {};
        const supplier = property.supplier || {};
        const contacts = property.contacts || {};

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

        // Transform room types with null checks
        const roomTypes = (property.room_types?.room_type_items || []).map((room) => ({
          name: room?.name || "Unknown",
          count: room?.count || 0,
          price: room?.price || 0,
          lease_unit: room?.lease_unit || "WEEK",
          currency: room?.rent_amount?.currency || "GBP",
        }));

        // Transform amenities with null checks
        const amenities = (property.amenities || []).map((amenity) => ({
          name: amenity?.name || "Unknown Amenity",
          icon_font: amenity?.icon_font || "",
        }));

        // Transform tags with null checks
        const tags = (property.tags || []).map((tag) => ({
          name: tag?.name || "Unknown Tag",
          color: tag?.color || "#555555",
          bg_color: tag?.bg_color || "#F5F5F5",
        }));

        // Transform school info with null checks
        const schoolInfo =
          school && school.school_id
            ? {
                school_id: school.school_id,
                school_name: school.school_name || "Unknown School",
                distance: school.distance || 0,
                location: school.location || {},
                traffic: school.traffic || [],
              }
            : null;

        // Transform reviews with null checks
        const reviews =
          property.reviews && property.reviews.avg_score
            ? {
                avg_score: property.reviews.avg_score || 0,
                review_count: property.reviews.review_count || 0,
                items: (property.reviews.items || []).slice(0, 5),
              }
            : null;

        // Transform contacts with null checks
        const contactInfo = {
          email: contacts?.email || null,
          phone: contacts?.phone || null,
          office: contacts?.office || [],
          language: contacts?.language || [],
        };

        // country
        const countrydata = {
          country_id: countrie?.country_id || null,
          country_name: countrie?.country_name || null,
          country_unique_name: countrie?.country_unique_name || null,
          ab: countrie.ab || ab,
        };
        // city
        const citydata = {
          city_name: city.city_name,
          city_id: city.city_id,
          city_unique_name: city.city_unique_name,
        };

        // Only add property if it has required fields
        if (house.house_id && house.title) {
          transformedProperties.push({
            house_id: house.house_id,
            title: house.title || "Unknown Property",
            city_name: city?.city_name || "Unknown City",
            address: location?.address || "Address not available",
            lat: location?.lat || null,
            lng: location?.lng || null,
            rent_amount: house.rent_amount?.amount || 0,
            rent_currency: house.rent_amount?.abbr || "GBP",
            promo_price: house.promo_price?.amount || 0,
            original_price: house.original_price?.amount || 0,
            lease_unit: house.lease_unit || "WEEK",
            images: processedImages,
            amenities: amenities,
            room_types: roomTypes,
            tags: tags,
            school_info: schoolInfo,
            reviews: reviews,
            contacts: contactInfo,
            supplier_name: supplier?.name || "Unknown Supplier",
            bed_num: house.bed_num || 0,
            total_floor: house.total_floor || 0,
            favorite_count: house.favorite_count || 0,
            booking_status: house.booking_status || 1,
            min_start_date: house.min_start_date || null,
            country: countrydata,
            city: citydata,
            is_active: true,
          });
        } else {
          console.warn("Skipping property with missing required fields:", {
            house_id: house.house_id,
            title: house.title,
          });
        }
      });
    }
  });

  return transformedProperties;
};

const extractCountryCityOnly = (rawJson) => {
  const transformed = transformPropertyData(rawJson);

  return transformed
    .filter((item) => item.house_id && item.country && item.city)
    .map((item) => ({
      house_id: item.house_id,
      country: item.country,
      city: item.city,
    }));
};

module.exports = { transformPropertyData, extractCountryCityOnly };
