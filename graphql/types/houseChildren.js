const {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
} = require("graphql");

const { GraphQLJSONObject } = require("graphql-scalars");

const HouseAmenityType = new GraphQLObjectType({
  name: "HouseAmenity",
  fields: () => ({
    house_id: { type: GraphQLID },
    amenity_id: { type: GraphQLID },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },
  }),
});

const HouseAdvisorType = new GraphQLObjectType({
  name: "HouseAdvisor",
  fields: () => ({
    house_id: { type: GraphQLID },
    owner_id: { type: GraphQLID },
    user_id: { type: GraphQLID },
    nickname: { type: GraphQLString },
    picture: { type: GraphQLString },
    mobile_w_cc: { type: GraphQLString },
    mobile_w: { type: GraphQLString },
    whatsapp_cc: { type: GraphQLString },
    whatsapp_mobile: { type: GraphQLString },
    staff_status: { type: GraphQLString },
    contact_type: { type: GraphQLString },
    count_val: { type: GraphQLInt },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },
  }),
});

const HouseLocationType = new GraphQLObjectType({
  name: "HouseLocation",
  fields: () => ({
    house_id: { type: GraphQLID },
    address: { type: GraphQLString },
    zipcode: { type: GraphQLString },
    lat: { type: GraphQLString },
    lng: { type: GraphQLString },
    place_id: { type: GraphQLString },
    street_view_lat: { type: GraphQLString },
    street_view_lng: { type: GraphQLString },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },
  }),
});

const HouseNavigateType = new GraphQLObjectType({
  name: "HouseNavigate",
  fields: () => ({
    house_id: { type: GraphQLID },
    seq: { type: GraphQLInt },
    name: { type: GraphQLString },
    url: { type: GraphQLString },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },
  }),
});

const HouseSchoolsType = new GraphQLObjectType({
  name: "HouseSchools",
  fields: () => ({
    house_id: { type: GraphQLID },
    school_id: { type: GraphQLID },
    house_count_shelve: { type: GraphQLInt },
    distance: { type: GraphQLString },
    polyline_id: { type: GraphQLID },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },
  }),
});

const HouseServiceTagsType = new GraphQLObjectType({
  name: "HouseServiceTags",
  fields: () => ({
    house_id: { type: GraphQLID },
    service_tag_id: { type: GraphQLID },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },
  }),
});

const HouseSwitchesType = new GraphQLObjectType({
  name: "HouseSwitches",
  fields: () => ({
    house_id: { type: GraphQLID },
    is_favorite: { type: GraphQLInt },
    is_submit_from: { type: GraphQLInt },
    is_has_live: { type: GraphQLInt },
    is_has_video: { type: GraphQLInt },
    is_has_vr: { type: GraphQLInt },
    ranking: { type: GraphQLInt },
    is_exclusive_offer: { type: GraphQLInt },
    is_exclusive_listing: { type: GraphQLInt },
    is_login_customer_house: { type: GraphQLInt },
    show_review_count: { type: GraphQLInt },
    on_site_verification: { type: GraphQLInt },
    on_site_video: { type: GraphQLInt },
    is_show_waiting: { type: GraphQLInt },
    is_show_sold_out: { type: GraphQLInt },
    is_agent_report: { type: GraphQLInt },
    is_house_report: { type: GraphQLInt },
    is_ten_years_anniversary: { type: GraphQLInt },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },
  }),
});

const HouseTagsType = new GraphQLObjectType({
  name: "HouseTags",
  fields: () => ({
    house_id: { type: GraphQLID },
    tag_id: { type: GraphQLID },
    sort: { type: GraphQLInt },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },
  }),
});

const HouseTipsType = new GraphQLObjectType({
  name: "HouseTips",
  fields: () => ({
    house_id: { type: GraphQLID },
    distance: { type: GraphQLString },
    is_show_available_room: { type: GraphQLInt },
    available_room: { type: GraphQLInt },
    sub_type_title: { type: GraphQLString },
    exclusive_is_exclusive_offer: { type: GraphQLInt },
    exclusive_expired_time: { type: GraphQLString },
    exclusive_remain_time: { type: GraphQLString },
    exclusive_offer_amount_value: { type: GraphQLString },
    exclusive_offer_amount_abbr: { type: GraphQLString },
    exclusive_desc: { type: GraphQLString },
    top_picks_rank: { type: GraphQLInt },
    top_picks_title: { type: GraphQLString },
    ten_anniversary_json: { type: GraphQLJSONObject },
    exclusive_introduce_json: { type: GraphQLJSONObject },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },
  }),
});

const HouseSchoolTrafficType = new GraphQLObjectType({
  name: "HouseSchoolTraffic",
  fields: () => ({
    house_id: { type: GraphQLID },
    school_id: { type: GraphQLID },
    traffic_type: { type: GraphQLString },
    distance: { type: GraphQLString },
    duration: { type: GraphQLInt },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },
  }),
});

const HouseRoomTypeTenancyType = new GraphQLObjectType({
  name: "HouseRoomTypeTenancy",
  fields: () => ({
    tenancy_id: { type: GraphQLID },
    house_id: { type: GraphQLID },
    unit_id: { type: GraphQLID },
    lease_time: { type: GraphQLInt },
    lease_time_max: { type: GraphQLInt },
    lease_unit: { type: GraphQLString },
    booking_status: { type: GraphQLID },
    start_date: { type: GraphQLString },
    start_date_max: { type: GraphQLString },
    end_date: { type: GraphQLString },
    end_date_max: { type: GraphQLString },
    price_unit: { type: GraphQLInt },
    term: { type: GraphQLString },
    rent_amount_value: { type: GraphQLString },
    rent_amount_abbr: { type: GraphQLString },
    rent_amount_max_value: { type: GraphQLString },
    rent_amount_max_abbr: { type: GraphQLString },
    promo_amount_value: { type: GraphQLString },
    promo_amount_abbr: { type: GraphQLString },
    has_final_promo_value: { type: GraphQLInt },
    has_promo: { type: GraphQLInt },
    sort: { type: GraphQLInt },
    service_tags_json: { type: GraphQLString },
    discount_lease_term_json: { type: GraphQLString },
    switch_json: { type: GraphQLString },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },
  }),
});

module.exports = {
  HouseAmenityType,
  HouseAdvisorType,
  HouseLocationType,
  HouseNavigateType,
  HouseSchoolsType,
  HouseServiceTagsType,
  HouseSwitchesType,
  HouseTagsType,
  HouseTipsType,
  HouseSchoolTrafficType,
  HouseRoomTypeTenancyType,
};
