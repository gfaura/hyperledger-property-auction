## Property Auction Application

## Uncompress the source files 
Uncompress the files to the location fabric-samples/test-network

## Deploy the chaincode

Open a command terminal and navigate to the test network directory:
```
cd ~/fabric-samples/test-network
```

Deploy the test network. Note that we use the `-ca` flag to deploy the network using certificate authorities. We will use the CA to register and enroll our sellers and buyers.
```
./network.sh up createChannel -ca
```

Deploy the property auction smart contract
```
./network.sh deployCC -ccn PropertyAuction -ccp ../propertyauction/chaincode-go/ -ccl go -ccep "OR('Org1MSP.peer','Org2MSP.peer')"
```


## Install the application dependencies

We will interact with the property auction smart contract through a set of Node.js applications. Change into the `application-javascript` directory:
```
cd ~/fabric-samples/propertyauction/application-javascript
```

Run the following command to download the application dependencies:
```
npm install
```

## Register and enroll the application identities

Enroll the Certificate Authority administrators of Org1 and Org2. Run the following command to enroll the Org1 admin:
```
node enrollAdmin.js org1
```
Now run the command to enroll the CA admin of Org2:
```
node enrollAdmin.js org2
```

Run the following command to register and enroll the seller identity that will create the auction. The seller will belong to Org1.
```
node registerEnrollUser.js org1 seller
```

Run the following commands to register and enroll 2 bidders from Org1 and another 2 bidders from Org2:
```
node registerEnrollUser.js org1 bidder1
node registerEnrollUser.js org1 bidder2
node registerEnrollUser.js org2 bidder3
node registerEnrollUser.js org2 bidder4
```

## Create the auction

The seller from Org1 would like to create an auction to sell a property. Run the following command to use the seller wallet to run the `createAuction.js` application. The seller needs to provide an ID for the auction and the item to be sold to create the auction:
```
node createAuction.js org1 seller PropertyAuction house 100000
```

After the transaction is complete, the `createAuction.js` application will query the auction stored in the public channel ledger:
```
*** Result: Auction: {
  "objectType": "auction",
  "item": "house",
  "seller": "eDUwOTo6Q049c2VsbGVyLE9VPWNsaWVudCtPVT1vcmcxK09VPWRlcGFydG1lbnQxOjpDTj1jYS5vcmcxLmV4YW1wbGUuY29tLE89b3JnMS5leGFtcGxlLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT",
  "organizations": [
    "Org1MSP"
  ],
  "privateBids": {},
  "revealedBids": {},
  "winner": "",
  "price": 0,
  "status": "for sale",
  "Bids": {},
  "askingprice": 100000,
  "highestbid": 0,
  "commissionorg": ""
}

```
The smart contract uses the `GetClientIdentity().GetID()` API to read identity that creates the auction and defines that identity as the auction `"seller"`. You can see the seller information by decoding the `"seller"` string out of base64 format:

```
echo eDUwOTo6Q049c2VsbGVyLE9VPWNsaWVudCtPVT1vcmcxK09VPWRlcGFydG1lbnQxOjpDTj1jYS5vcmcxLmV4YW1wbGUuY29tLE89b3JnMS5leGFtcGxlLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT | base64 --decode
```

The result is the name and issuer of the seller's certificate:
```
x509::CN=org1admin,OU=admin,O=Hyperledger,ST=North Carolina,C=US::CN=ca.org1.example.com,O=org1.example.com,L=Durham,ST=North Carolina,C=USn
```

## Bid on the property

We can now use the bidder wallets to submit bids to the auction:

### Bid as bidder1

Bidder1 will create a bid to purchase the house for 90000 dollars.
```
node bid.js org1 bidder1 PropertyAuction 90000 

```

The application will query the bid after it is created:
```
*** Result:  Bid: {
  "objectType": "bid",
  "price": 90000,
  "org": "Org1MSP",
  "bidder": "eDUwOTo6Q049YmlkZGVyMSxPVT1jbGllbnQrT1U9b3JnMStPVT1kZXBhcnRtZW50MTo6Q049Y2Eub3JnMS5leGFtcGxlLmNvbSxPPW9yZzEuZXhhbXBsZS5jb20sTD1EdXJoYW0sU1Q9Tm9ydGggQ2Fyb2xpbmEsQz1VUw=="
}
```

The bid is stored in the Org1 implicit data collection. The `"bidder"` parameter is the information from the certificate of the user that created the bid. Only this identity will be able to query the bid from private state or reveal the bid during the auction.

The `bid.js` application also prints the bidID:
```
*** Result ***SAVE THIS VALUE*** BidID: e44bbd670978a1c0042d6257b91772ef54a7ce624fabb0d04ab62f7c3bc85c7d
```

The BidID acts as the unique identifier for the bid. This ID allows you to query the bid using the `queryBid.js` program and add the bid to the auction. Save the bidID returned by the application as an environment variable in your terminal:
```
export BIDDER1_BID_ID=90c1f2b7e443a486c65a4d5a04ecbc97f114fdb461bda0c05bf44a1490cb264f
```
This value will be different for each transaction, so you will need to use the value returned in your terminal.

Now that the bid has been created, you can submit the bid to the auction. Run the following command to submit the bid that was just created:
```
node submitBid.js org1 bidder1 PropertyAuction $BIDDER1_BID_ID
```

The bid won't be able to be submitted because the bid is smaller than the asking price. An error message will be returned as follows
```
--> Submit Transaction: add bid to the auction
2021-04-21T22:06:21.167Z - error: [Transaction]: Error: No valid responses from any peers. Errors:
    peer=peer0.org1.example.com:7051, status=500, message=failed submitting the bid. The price offered must be greater or equal to the asking price: 100000
```

Repeat the process above but with a valid bid of 200000 dollars
```
node bid.js org1 bidder1 PropertyAuction 200000 
export BIDDER1_BID_ID=58c7af80bf7d6b041fd5232e5c7b362404b8059c57fb07ffcec7a82d1df144cc
node submitBid.js org1 bidder1 PropertyAuction $BIDDER1_BID_ID

```

The hash of bid will be added to the list private bids in that have been submitted to `PaintingAuction`. Storing the hash in the public auction allows users to accurately reveal the bid after bidding is closed. The application will query the auction to verify that the bid was added:
```
*** Result: Auction: {
  "objectType": "auction",
  "item": "house",
  "seller": "eDUwOTo6Q049c2VsbGVyLE9VPWNsaWVudCtPVT1vcmcxK09VPWRlcGFydG1lbnQxOjpDTj1jYS5vcmcxLmV4YW1wbGUuY29tLE89b3JnMS5leGFtcGxlLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT",
  "organizations": [
    "Org1MSP"
  ],
  "privateBids": {
    "\u0000bid\u0000PropertyAuction\u0000af8eff6fb03357b9d254728520d6fef226b30755cfa0306470155e40128f0962\u0000": {
      "org": "Org1MSP",
      "hash": "f6d39d0d90488edbc4b9a8d691b4a633001a2bc8c2038eac66325be8a9bdcae8"
    }
  },
  "revealedBids": {},
  "winner": "",
  "price": 0,
  "status": "for sale",
  "highestbid": 200000,
  "askingprice": 100000,
  "commissionorg": ""
}


```

### Bid as bidder2

Let's submit another bid. Bidder2 would like to purchase the painting for 150000 dollars.
```
node bid.js org1 bidder2 PropertyAuction 150000
```

Save the Bid ID returned by the application:
```
export BIDDER2_BID_ID=f99fa4224dc8c6bdaad999f76de3a12edab173d69de8300a33497681d6976343
```

Submit bidder2's bid to the auction:
```
node submitBid.js org1 bidder2 PropertyAuction $BIDDER2_BID_ID
```

The bid won't be able to be submitted because the bid is smaller than the highest existing bid. An error message will be returned as follows
```
--> Submit Transaction: add bid to the auction
2021-04-21T22:12:07.424Z - error: [Transaction]: Error: No valid responses from any peers. Errors:
    peer=peer0.org1.example.com:7051, status=500, message=failed submitting the bid. The price offered must be greater than the existing highest bid: 200000
```

Repeat the process above but with a valid bid of 210000 dollars
```
node bid.js org1 bidder2 PropertyAuction 210000 
export BIDDER2_BID_ID=90c1f2b7e443a486c65a4d5a04ecbc97f114fdb461bda0c05bf44a1490cb264f
node submitBid.js org1 bidder2 PropertyAuction $BIDDER2_BID_ID

```



### Bid as bidder3 from Org2

Bidder3 will bid 250000 dollars for the house:
```
node bid.js org2 bidder3 PropertyAuction 250000
```

Save the Bid ID returned by the application:
```
export BIDDER3_BID_ID=ba617d036fec6a8ace248975cd8220ea9838ac863310eed8dafbc6a78a635bf3
```

Add bidder3's bid to the auction:
```
node submitBid.js org2 bidder3 PropertyAuction $BIDDER3_BID_ID
```

Because bidder3 belongs to Org2, submitting the bid will add Org2 to the list of participating organizations. You can see the Org2 MSP ID has been added to the list of `"organizations"` in the updated auction returned by the application:
```
*** Result: Auction: {
  "objectType": "auction",
  "item": "house",
  "seller": "eDUwOTo6Q049c2VsbGVyLE9VPWNsaWVudCtPVT1vcmcxK09VPWRlcGFydG1lbnQxOjpDTj1jYS5vcmcxLmV4YW1wbGUuY29tLE89b3JnMS5leGFtcGxlLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT",
  "organizations": [
    "Org1MSP",
    "Org2MSP"
  ],
  "privateBids": {
    "\u0000bid\u0000PropertyAuction\u00001afcca99091948d10687abe5e43c029f8f373b3e51a299d132b5a4351601dca1\u0000": {
      "org": "Org1MSP",
      "hash": "f6d39d0d90488edbc4b9a8d691b4a633001a2bc8c2038eac66325be8a9bdcae8"
    },
    "\u0000bid\u0000PropertyAuction\u00006769f54b0ee986008603fce5bf8ac658518f5e90a40d1bdfb9f1af45c4679d2e\u0000": {
      "org": "Org1MSP",
      "hash": "54a470d011fabc4861079c45b29d6fc57ebcaf2f0338bdbfc2264f9ebd8545e4"
    },
    "\u0000bid\u0000PropertyAuction\u0000b55666f954ef21749cbe6631d221b35287668553599ff412427cd16b0f569f4d\u0000": {
      "org": "Org2MSP",
      "hash": "63ed8b47b6f594846f9786c304aef3409d67758b5598e3a726e06af48136c73c"
    }
  },
  "revealedBids": {},
  "winner": "",
  "price": 0,
  "status": "for sale",
  "Bids": {},
  "askingprice": 100000
}

```

Now that a bid from Org2 has been added to the auction, any updates to the auction need to be endorsed by the Org2 peer. The applications will use `"organizations"` field to specify which organizations need to endorse submitting a new bid, revealing a bid, or updating the auction status.

### Bid as bidder4

Bidder4 from Org2 would like to purchase the painting for 400000 dollars:
```
node bid.js org2 bidder4 PropertyAuction 400000
```

Save the Bid ID returned by the application:
```
export BIDDER4_BID_ID=5666c8197cd252d4ab4c6aa3a70093ea6087f31c23f4e7930cab6e5f0f2ab5e4
```

Add bidder4's bid to the auction:
```
node submitBid.js org2 bidder4 PropertyAuction $BIDDER4_BID_ID
```

## Close the auction

Now that all four bidders have joined the auction, the seller would like to close the auction and allow buyers to reveal their bids. The seller identity that created the auction needs to submit the transaction:
```
node closeAuction.js org1 seller PropertyAuction
```

The application will query the auction to allow you to verify that the auction status has changed to closed. As a test, you can try to create and submit a new bid to verify that no new bids can be added to the auction.

## Reveal bids

After the auction is closed, bidders can try to win the auction by revealing their bids. The transaction to reveal a bid needs to pass four checks:
1. The auction is closed.
2. The transaction was submitted by the identity that created the bid.
3. The hash of the revealed bid matches the hash of the bid on the channel ledger. This confirms that the bid is the same as the bid that is stored in the private data collection.
4. The hash of the revealed bid matches the hash that was submitted to the auction. This confirms that the bid was not altered after the auction was closed.

Use the `revealBid.js` application to reveal the bid of Bidder1:
```
node revealBid.js org1 bidder1 PropertyAuction $BIDDER1_BID_ID
```

The full bid details, including the price, are now visible:
```
*** Result: Auction: {
  "objectType": "auction",
  "item": "house",
  "seller": "eDUwOTo6Q049c2VsbGVyLE9VPWNsaWVudCtPVT1vcmcxK09VPWRlcGFydG1lbnQxOjpDTj1jYS5vcmcxLmV4YW1wbGUuY29tLE89b3JnMS5leGFtcGxlLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT",
  "organizations": [
    "Org1MSP",
    "Org2MSP"
  ],
  "privateBids": {
    "\u0000bid\u0000PaintingAuction\u000049466271ae879bd009e75a60730a12bfa986e75f263202ab81ccd3deec544a35\u0000": {
      "org": "Org2MSP",
      "hash": "b8eaeb4422b93abdfe4ccb6aa11b745b3d1cb072a99bd3eb3618f081fb1b1f89"
    },
    "\u0000bid\u0000PaintingAuction\u00005e4e637c68833b178739575f6fe09820b019551a8cfbb43a4d172e0aa864dfad\u0000": {
      "org": "Org2MSP",
      "hash": "40107eab7a99dfc2f25d02b8ab840f12fd802a9f86d8d42b78d7b4409b2c15bd"
    },
    "\u0000bid\u0000PaintingAuction\u00008ef83011a5fb791f75ed008337839426f6b87981519e5d58ef5ada39c3044edd\u0000": {
      "org": "Org1MSP",
      "hash": "5cb50a17b5a21c02fc01306e3e9b54f4db67e9a440552ce898bbd7daa62dce0f"
    },
    "\u0000bid\u0000PaintingAuction\u0000915a908c8f2c368f4a3aedd73176656af81ddfab000b11629503403f3d97b185\u0000": {
      "org": "Org1MSP",
      "hash": "a458df18b12dffe4ae6d56a270134c2d55bd53fface034bd24381d0073d46a45"
    }
  },
  "revealedBids": {
    "\u0000bid\u0000PaintingAuction\u00008ef83011a5fb791f75ed008337839426f6b87981519e5d58ef5ada39c3044edd\u0000": {
      "objectType": "bid",
      "price": 800,
      "org": "Org1MSP",
      "bidder": "eDUwOTo6Q049YmlkZGVyMSxPVT1jbGllbnQrT1U9b3JnMStPVT1kZXBhcnRtZW50MTo6Q049Y2Eub3JnMS5leGFtcGxlLmNvbSxPPW9yZzEuZXhhbXBsZS5jb20sTD1EdXJoYW0sU1Q9Tm9ydGggQ2Fyb2xpbmEsQz1VUw=="
    }
  },
  "winner": "",
  "price": 0,
  "status": "closed"
}
```

Bidder3 from Org2 will also reveal their bid:
```
node revealBid.js org2 bidder3 PropertyAuction $BIDDER3_BID_ID
```

If the auction ended now, Bidder1 would win. Let's try to end the auction using the seller identity and see what happens.

```
node endAuction.js org1 seller PropertyAuction
```

The output should look something like the following:

```
--> Submit the transaction to end the auction
2020-11-06T13:16:11.591Z - warn: [TransactionEventHandler]: strategyFail: commit failure for transaction "99feade5b7ec223839200867b57d18971c3e9f923efc95aaeec720727f927366": TransactionError: Commit of transaction 99feade5b7ec223839200867b57d18971c3e9f923efc95aaeec720727f927366 failed on peer peer0.org1.example.com:7051 with status ENDORSEMENT_POLICY_FAILURE
******** FAILED to submit bid: TransactionError: Commit of transaction 99feade5b7ec223839200867b57d18971c3e9f923efc95aaeec720727f927366 failed on peer peer0.org1.example.com:7051 with status ENDORSEMENT_POLICY_FAILURE
```

Instead of ending the auction, the transaction results in an endorsement policy failure. The end of the auction needs to be endorsed by Org2. Before endorsing the transaction, the Org2 peer queries its private data collection for any winning bids that have not yet been revealed. Because Bidder4 created a bid that is above the winning price, the Org2 peer refuses to endorse the transaction that would end the auction.

Before we can end the auction, we need to reveal the bid from bidder4.
```
node revealBid.js org2 bidder4 PropertyAuction $BIDDER4_BID_ID
```

Bidder2 from Org1 would not win the auction in either case. As a result, Bidder2 decides not to reveal their bid.

## End the auction

Now that the winning bids have been revealed, we can end the auction:
```
node endAuction org1 seller PropertyAuction
```

The transaction was successfully endorsed by both Org1 and Org2, who both calculated the same price and winner. The winning bidder is listed along with the price:
```
*** Result: committed

--> Evaluate Transaction: query the updated auction
*** Result: Auction: {
  "objectType": "auction",
  "item": "house",
  "seller": "eDUwOTo6Q049c2VsbGVyLE9VPWNsaWVudCtPVT1vcmcxK09VPWRlcGFydG1lbnQxOjpDTj1jYS5vcmcxLmV4YW1wbGUuY29tLE89b3JnMS5leGFtcGxlLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT",
  "organizations": [
    "Org1MSP",
    "Org2MSP"
  ],
  "privateBids": {
    "\u0000bid\u0000PropertyAuction\u00002e209898dc60487bb2c2b42e8ad06a38d33f8e52462907048442cda8652a7e9c\u0000": {
      "org": "Org2MSP",
      "hash": "db7d17a274847aed745084332fea6b99a00ec7c45b44a3572ea7f69f85c404f9"
    },
    "\u0000bid\u0000PropertyAuction\u000086f7600b4fff81b835af2dd73cf564fdf44d0ba7185f21b497424abe0ed46c07\u0000": {
      "org": "Org1MSP",
      "hash": "b07c760e23de542ffe782200141eea5d9d35535f3615168e057edf3d0cae3a4c"
    },
    "\u0000bid\u0000PropertyAuction\u0000bbec956fb45162f56233df10df2eb161fb077cb0c5430b50322c121caef790eb\u0000": {
      "org": "Org1MSP",
      "hash": "f6d39d0d90488edbc4b9a8d691b4a633001a2bc8c2038eac66325be8a9bdcae8"
    },
    "\u0000bid\u0000PropertyAuction\u0000d1b3a6f254ba0780fd5f176e7b42e0604aa5961702122457ba672e5b499481d2\u0000": {
      "org": "Org2MSP",
      "hash": "63ed8b47b6f594846f9786c304aef3409d67758b5598e3a726e06af48136c73c"
    }
  },
  "revealedBids": {
    "\u0000bid\u0000PropertyAuction\u00002e209898dc60487bb2c2b42e8ad06a38d33f8e52462907048442cda8652a7e9c\u0000": {
      "objectType": "bid",
      "price": 400000,
      "org": "Org2MSP",
      "bidder": "eDUwOTo6Q049YmlkZGVyNCxPVT1jbGllbnQrT1U9b3JnMitPVT1kZXBhcnRtZW50MTo6Q049Y2Eub3JnMi5leGFtcGxlLmNvbSxPPW9yZzIuZXhhbXBsZS5jb20sTD1IdXJzbGV5LFNUPUhhbXBzaGlyZSxDPVVL"
    },
    "\u0000bid\u0000PropertyAuction\u0000bbec956fb45162f56233df10df2eb161fb077cb0c5430b50322c121caef790eb\u0000": {
      "objectType": "bid",
      "price": 200000,
      "org": "Org1MSP",
      "bidder": "eDUwOTo6Q049YmlkZGVyMSxPVT1jbGllbnQrT1U9b3JnMStPVT1kZXBhcnRtZW50MTo6Q049Y2Eub3JnMS5leGFtcGxlLmNvbSxPPW9yZzEuZXhhbXBsZS5jb20sTD1EdXJoYW0sU1Q9Tm9ydGggQ2Fyb2xpbmEsQz1VUw=="
    },
    "\u0000bid\u0000PropertyAuction\u0000d1b3a6f254ba0780fd5f176e7b42e0604aa5961702122457ba672e5b499481d2\u0000": {
      "objectType": "bid",
      "price": 250000,
      "org": "Org2MSP",
      "bidder": "eDUwOTo6Q049YmlkZGVyMyxPVT1jbGllbnQrT1U9b3JnMitPVT1kZXBhcnRtZW50MTo6Q049Y2Eub3JnMi5leGFtcGxlLmNvbSxPPW9yZzIuZXhhbXBsZS5jb20sTD1IdXJzbGV5LFNUPUhhbXBzaGlyZSxDPVVL"
    }
  },
  "winner": "eDUwOTo6Q049YmlkZGVyNCxPVT1jbGllbnQrT1U9b3JnMitPVT1kZXBhcnRtZW50MTo6Q049Y2Eub3JnMi5leGFtcGxlLmNvbSxPPW9yZzIuZXhhbXBsZS5jb20sTD1IdXJzbGV5LFNUPUhhbXBzaGlyZSxDPVVL",
  "price": 400000,
  "status": "sold",
  "highestbid": 400000,
  "askingprice": 100000,
  "commissionorg": "Org2MSP"
}

```

## Clean up

When your are done using the auction smart contract, you can bring down the network and clean up the environment. In the `propertyauction/application-javascript` directory, run the following command to remove the wallets used to run the applications:
```
rm -rf wallet
```

You can then navigate to the test network directory and bring down the network:
````
cd ../../test-network/
./network.sh down
````
