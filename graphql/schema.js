const { GraphQLSchema } = require("graphql");
const RootQuery = require("./rootQuery");

module.exports = new GraphQLSchema({
  query: RootQuery,
});

// const HouseType = require("./types/houseType");
// const {
//   HouseAmenityType,
//   HouseAdvisorType,
//   HouseLocationType,
//   HouseNavigateType,
//   HouseSchoolsType,
//   HouseServiceTagsType,
//   HouseSwitchesType,
//   HouseTagsType,
//   HouseTipsType,
//   HouseSchoolTrafficType,
//   HouseRoomTypeTenancyType,
// } = require("./types/houseChildren");

// module.exports = new GraphQLSchema({
//   query: RootQuery,
//   types: [
//     HouseType,
//     HouseAmenityType,
//     HouseAdvisorType,
//     HouseLocationType,
//     HouseNavigateType,
//     HouseSchoolsType,
//     HouseServiceTagsType,
//     HouseSwitchesType,
//     HouseTagsType,
//     HouseTipsType,
//     HouseSchoolTrafficType,
//     HouseRoomTypeTenancyType,
//   ],
// });
