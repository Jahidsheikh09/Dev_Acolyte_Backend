const {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLList,
} = require("graphql");

const { GraphQLJSONObject } = require("graphql-scalars");

const {
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
} = require("./houseChildren");

const { GraphQLEnumType } = require("graphql");

const RoomTypesStatusEnum = new GraphQLEnumType({
  name: "RoomTypesStatusEnum",
  values: {
    PENDING: { value: 0 },
    DONE: { value: 1 },
    FAILED: { value: 2 },
  },
});

const HouseType = new GraphQLObjectType({
  name: "House",
  fields: () => ({
    house_id: { type: GraphQLID },
    sku: { type: GraphQLString },
    type_id: { type: GraphQLID },
    sub_type_id: { type: GraphQLID },
    sub_type: { type: GraphQLID },
    cust_id: { type: GraphQLID },
    supplier_id: { type: GraphQLID },
    city_id: { type: GraphQLID },
    state_id: { type: GraphQLID },
    country_id: { type: GraphQLID },
    house_status: { type: GraphQLInt },
    publish_type: { type: GraphQLInt },
    has_sublease: { type: GraphQLInt },
    title: { type: GraphQLString },
    booking_status: { type: GraphQLInt },
    favorite_count: { type: GraphQLInt },
    lease_unit: { type: GraphQLString },
    rent_amount_value: { type: GraphQLString },
    rent_amount_abbr: { type: GraphQLString },
    promo_price_value: { type: GraphQLString },
    promo_price_abbr: { type: GraphQLString },
    original_price_value: { type: GraphQLString },
    original_price_abbr: { type: GraphQLString },
    min_start_date: { type: GraphQLString },
    house_url: { type: GraphQLString },
    ranking: { type: GraphQLInt },
    supplier_logo: { type: GraphQLString },
    bed_num: { type: GraphQLInt },
    total_floor: { type: GraphQLInt },
    room_type_count: { type: GraphQLInt },
    hasReleased: { type: GraphQLBoolean },
    media_image_paths: { type: GraphQLJSONObject },
    raw_payload_json: { type: GraphQLJSONObject },
    source_city_unique_name: { type: GraphQLString },
    source_country_unique_name: { type: GraphQLString },
    room_types_done: { type: GraphQLBoolean },
    room_types_updated_at: { type: GraphQLString },
    raw_room_type_payload: { type: GraphQLJSONObject },
    has_room_types: { type: GraphQLBoolean },
    room_type_payload: { type: GraphQLJSONObject },
    raw_room_type_payload_json: { type: GraphQLJSONObject },
    room_type_image_paths: { type: GraphQLJSONObject },
    room_types_status: { type: RoomTypesStatusEnum },
    room_types_worker: { type: GraphQLString },
    room_types_attempts: { type: GraphQLInt },
    room_types_last_error: { type: GraphQLString },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },

    // Relations

    advisorDetails: {
      type: new GraphQLList(HouseAdvisorType),
      resolve(parent) {
        return parent.house_advisors;
      },
    },
    keyAmenities: {
      type: new GraphQLList(HouseAmenityType),
      resolve(parent) {
        return parent.house_amenities;
      },
    },
    locationDetails: {
      type: new GraphQLList(HouseLocationType),
      resolve(parent) {
        return parent.house_locations;
      },
    },
    navigateDetails: {
      type: new GraphQLList(HouseNavigateType),
      resolve(parent) {
        return parent.house_navigate;
      },
    },
    schoolDetails: {
      type: new GraphQLList(HouseSchoolsType),
      resolve(parent) {
        return parent.house_schools;
      },
    },
    serviceTags: {
      type: new GraphQLList(HouseServiceTagsType),
      resolve(parent) {
        return parent.house_service_tags;
      },
    },
    houseSwitches: {
      type: new GraphQLList(HouseSwitchesType),
      resolve(parent) {
        return parent.house_switches;
      },
    },
    houseTags: {
      type: new GraphQLList(HouseTagsType),
      resolve(parent) {
        return parent.house_tags;
      },
    },
    houseTips: {
      type: new GraphQLList(HouseTipsType),
      resolve(parent) {
        return parent.house_tips;
      },
    },
    houseRoomTypes: {
      type: new GraphQLList(HouseRoomTypeTenancyType),
      resolve(parent) {
        return parent.house_room_types;
      },
    },
    roomTypeTenancies: {
      type: new GraphQLList(HouseRoomTypeTenancyType),
      resolve(parent) {
        return parent.room_type_tenancies;
      },
    },
    schoolTraffic: {
      type: new GraphQLList(HouseSchoolTrafficType),
      resolve(parent) {
        return parent.school_traffic;
      },
    },
  }),
});

module.exports = HouseType;
