const client = require("composer-client");
const BusinessNetworkConnection = client.BusinessNetworkConnection;
const connection = new BusinessNetworkConnection({ type: 'composer-wallet-filesystem' });

module.exports = connection;