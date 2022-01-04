var connection = require('./connection');
var businessDefinition = connection.getBusinessNetwork();
const factory = businessDefinition.getFactory();

module.exports.addLandRecord = async function (landId, owner, coordinates) {
    var land = factory.newReource("org.pingala.landregistry", "Land", landId);
    land.owner = owner;
    land.coordinates = coordinates;
    
    var landAssetRegistry = await connection.getAssetRegistry('org.pingala.landregistry.Land');
    try {
        var res = await landAssetRegistry.add(land);
    } catch (error) {
        console.log('error: ', error);
    }
    return res;
}