/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const { buildCCPOrg1, buildCCPOrg2, buildCCPPropertyRegister, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const myChannel = 'mychannel';
const myChaincodeName = 'PropertyAuction'; //GF: Name of our chaincode will be PropertyAuction


function prettyJSONString(inputString) {
    if (inputString) {
        return JSON.stringify(JSON.parse(inputString), null, 2);
    }
    else {
        return inputString;
    }
}

//GF: Adding asking price to the property auction
async function createAuction(ccp,wallet,user,auctionID,item,askingprice) {
    try {

        const gateway = new Gateway();
      //connect using Discovery enabled

      await gateway.connect(ccp,
          { wallet: wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });

        const network = await gateway.getNetwork(myChannel);
        const contract = network.getContract(myChaincodeName);

        let statefulTxn = contract.createTransaction('CreateAuction');

        //GF: Adding asking price to the property auction
        console.log('\n--> Submit Transaction: Propose a new Property auction');
        await statefulTxn.submit(auctionID,item,askingprice);
        console.log('*** Result: committed');

        console.log('\n--> Evaluate Transaction: query the Property auction that was just created');
        let result = await contract.evaluateTransaction('QueryAuction',auctionID);
        console.log('*** Result: Auction: ' + prettyJSONString(result.toString()));

        gateway.disconnect();
    } catch (error) {
        console.error(`******** FAILED to submit bid: ${error}`);
	}
}

async function main() {
    try {
        //GF: Adding validation for the asking price
        if (process.argv[2] == undefined || process.argv[3] == undefined
            || process.argv[4] == undefined || process.argv[5] == undefined || process.argv[6] == undefined) {
            console.log("Usage: node createAuction.js org userID auctionID item askingprice");
            process.exit(1);
        }

        const org = process.argv[2]
        const user = process.argv[3];
        const auctionID = process.argv[4];
        const item = process.argv[5];
        const askingprice = process.argv[6]; //GF: Adding asking price

        if (org == 'Org1' || org == 'org1') {

            const orgMSP = 'Org1MSP';
            const ccp = buildCCPOrg1();
            const walletPath = path.join(__dirname, 'wallet/org1');
            const wallet = await buildWallet(Wallets, walletPath);
            await createAuction(ccp,wallet,user,auctionID,item,askingprice); //GF: Adding asking price
        }
        else if (org == 'Org2' || org == 'org2') {

            const orgMSP = 'Org2MSP';
            const ccp = buildCCPOrg2();
            const walletPath = path.join(__dirname, 'wallet/org2');
            const wallet = await buildWallet(Wallets, walletPath);
            await createAuction(ccp,wallet,user,auctionID,item,askingprice); //GF: Adding asking price
        }
        else if (org == 'Org3' || org == 'org3') {

            const orgMSP = 'Org3';
            const ccp = buildCCPPropertyRegister();
            const walletPath = path.join(__dirname, 'wallet/org3');
            const wallet = await buildWallet(Wallets, walletPath);
            await createAuction(ccp,wallet,user,auctionID,item,askingprice); //GF: Adding asking price
        }   else {
            console.log("Usage: node createAuction.js org userID auctionID item askingprice");
            console.log("Org must be Org1, Org2 or Org3");
          }
    } catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
    }
}


main();
