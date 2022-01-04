/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Sample transaction
 * @param {org.landreg.landregistry.SellLand} tx 
 * @transaction
 */
async function sellLand(trx) {
    var factory = getFactory();
    var newOwner = factory.newRelationship('org.landreg.landregistry', 'User', trx.newOwner);

    trx.land.owner = newOwner;

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry('org.landreg.landregistry.Land');
    // Update the asset in the asset registry.
    await assetRegistry.update(trx.land);
}

/**
 * Sample transaction
 * @param {org.landreg.landregistry.processLandDeptSellRequest} trx
 * @transaction
 */
async function processLandDeptSellRequest(trx) {
    var factory = getFactory();

    // Get the asset registry for the LandDeptSellRequest.
    const landDeptRegistry = await getAssetRegistry('org.landreg.landregistry.LandDeptSellRequest');
    var landDeptRequest = await landDeptRegistry.get(trx.requestId);
    var requestId = landDeptRequest.requestId;
    var landId = landDeptRequest.landId;
    var newOwner = landDeptRequest.newOwner;

    // Update STATE to APPROVED
    landDeptRequest.approvedByMuncipality = true;
    await landDeptRegistry.update(landDeptRequest);

    // Add new resource in MuncipalityRequestRegistry
    const MuncipalityRequestRegistry = await getAssetRegistry('org.landreg.landregistry.MuncipalitySellRequest');
    var MuncipalityRequest = factory.newResource('org.landreg.landregistry', 'MuncipalitySellRequest', requestId);
    MuncipalityRequest.landId = landId;
    MuncipalityRequest.newOwner = newOwner;

    if (landDeptRequest.partSell == true || landDeptRequest.partSell == "true") {
        MuncipalityRequest.partSell = landDeptRequest.partSell;
        MuncipalityRequest.oldCoordinates = landDeptRequest.oldCoordinates;
        MuncipalityRequest.sellCoordinates = landDeptRequest.sellCoordinates;
        MuncipalityRequest.keepCoodinates = landDeptRequest.keepCoodinates;
        MuncipalityRequest.newLandId = landDeptRequest.newLandId;
    }

    MuncipalityRequestRegistry.add(MuncipalityRequest);
}

/**
 * Sample transaction
 * @param {org.landreg.landregistry.processMuncipalitySellRequest} trx
 * @transaction
 */
async function processMuncipalitySellRequest(trx) {
    var factory = getFactory();

    const MuncipalityRequestRegistry = await getAssetRegistry('org.landreg.landregistry.MuncipalitySellRequest');
    const landDeptRegistry = await getAssetRegistry('org.landreg.landregistry.LandDeptSellRequest');
    var muncipalityRequest = await MuncipalityRequestRegistry.get(trx.requestId);

    var newOwner = factory.newRelationship('org.landreg.landregistry', 'User', muncipalityRequest.newOwner);

    // Get the asset registry for the Land.
    const landAssetRegistry = await getAssetRegistry('org.landreg.landregistry.Land');

    if (muncipalityRequest.partSell == true) {
        // Update existing Land coordinates
        var land = await landAssetRegistry.get(muncipalityRequest.landId);
        land.coordinates = muncipalityRequest.keepCoodinates;
        await landAssetRegistry.update(land);

        // Create new land
        var newLand = factory.newResource('org.landreg.landregistry', 'Land', muncipalityRequest.newLandId);
        newLand.owner = newOwner;
        newLand.coordinates = muncipalityRequest.sellCoordinates;
        newLand.partOf = muncipalityRequest.landId;
        landAssetRegistry.add(newLand);
    } else {
        var land = await landAssetRegistry.get(muncipalityRequest.landId);
        land.owner = newOwner;
        await landAssetRegistry.update(land);
    }

    // Remove Sell Requests of Land Dept and Muncipality
    await MuncipalityRequestRegistry.remove(muncipalityRequest.requestId);
    await landDeptRegistry.remove(muncipalityRequest.requestId);
}