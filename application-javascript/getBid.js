/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const { buildCCPOrg1, buildCCPOrg2, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const myChannel = 'mychannel';
const myChaincodeName = 'PropertyAuction'; //GF: Chainging smart contract


function prettyJSONString(inputString) {
    if (inputString) {
        return JSON.stringify(JSON.parse(inputString), null, 2);
    }
    else {
        return inputString;
    }
}

async function GetBidPrice(ccp,wallet,user,auctionID,bidID) {
    try {

        const gateway = new Gateway();
      //connect using Discovery enabled

      await gateway.connect(ccp,
          { wallet: wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });

        const network = await gateway.getNetwork(myChannel);
        const contract = network.getContract(myChaincodeName);

        console.log('\n--> Evaluate Transaction: read bid from private data store');
        let result = await contract.evaluateTransaction('GetBidPrice',auctionID,bidID);
        console.log('*** Result: Bid: ' + prettyJSONString(result.toString()));
        console.log('*** Result: Bid Amount: ' + result.toString());

        gateway.disconnect();
    } catch (error) {
        console.error(`******** FAILED to submit bid: ${error}`);
	}
}

async function main() {
    try {

        if (process.argv[2] == undefined || process.argv[3] == undefined
            || process.argv[4] == undefined || process.argv[5] == undefined) {
            console.log("Usage: node bid.js org userID auctionID bidID");
            process.exit(1);
        }

        const org = process.argv[2]
        const user = process.argv[3];
        const auctionID = process.argv[4];
        const bidID = process.argv[5];

        if (org == 'Org1' || org == 'org1') {

            const orgMSP = 'Org1MSP';
            const ccp = buildCCPOrg1();
            const walletPath = path.join(__dirname, 'wallet/org1');
            const wallet = await buildWallet(Wallets, walletPath);
            await GetBidPrice(ccp,wallet,user,auctionID,bidID);
        }
        else if (org == 'Org2' || org == 'org2') {

            const orgMSP = 'Org2MSP';
            const ccp = buildCCPOrg2();
            const walletPath = path.join(__dirname, 'wallet/org2');
            const wallet = await buildWallet(Wallets, walletPath);
            await GetBidPrice(ccp,wallet,user,auctionID,bidID);
        } else {
            console.log("Usage: node bid.js org userID auctionID bidID");
            console.log("Org must be Org1 or Org2");
          }
    } catch (error) {
        console.error(`******** FAILED to run the application: ${error}`);
    }
}


main();
