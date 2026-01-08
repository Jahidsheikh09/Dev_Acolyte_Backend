const { GraphQLObjectType, GraphQLID } = require("graphql");
const HouseType = require("./types/houseType");
const { getHousesById } = require("./resolvers/houseResolver");

const RootQuery = new GraphQLObjectType({
  name: "RootQuery",
  fields: {
    houseById: {
      type: HouseType,
      args: { id: { type: GraphQLID } },
      resolve: getHousesById,
    },
  },
});

module.exports = RootQuery;
