/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const { Gateway, Wallets } = require("fabric-network");
const fs = require("fs");
const path = require("path");
const helper = require("./helper");
const log4js = require("log4js");
const util = require("util");
var logger = log4js.getLogger();

// async function main() {
//     try {

//         // load the network configuration
//         const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
//         let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

//         // Create a new file system based wallet for managing identities.
//         const walletPath = path.join(process.cwd(), 'wallet');
//         const wallet = await Wallets.newFileSystemWallet(walletPath);
//         console.log(`Wallet path: ${walletPath}`);

//         // Check to see if we've already enrolled the user.
//         const identity = await wallet.get('appUser');
//         if (!identity) {
//             console.log('An identity for the user "appUser" does not exist in the wallet');
//             console.log('Run the registerUser.js application before retrying');
//             return;
//         }

//         // Create a new gateway for connecting to our peer node.
//         const gateway = new Gateway();
//         await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

//         // Get the network (channel) our contract is deployed to.
//         const network = await gateway.getNetwork('mychannel');

//         // Get the contract from the network.
//         const contract = network.getContract('electricLadger');

//         // Submit the specified transaction.
//         const users = [
//            {

//             name:'Ali',
//             address:'korangi',
//             units:20

//            },
//            {
//             name:'moiz',
//             address:'malir cent',
//             units:50

//            },
//            {
//             name:'akbar',
//             address:'clifton ',
//             units:70

//            },
//            {
//             name:'tayyab',
//             address:'clifton ',
//             units:7000

//            },
//            {
//             name:'muzafar',
//             address:'clifton ',
//             units:70

//            },

//         ];

//         for (let i = 0; i < users.length; i++) {
//             users[i].docType = 'Users';
//             await contract.submitTransaction("writeData",'uid'+i, Buffer.from(JSON.stringify(users[i])));

//             console.info('Added <--> ', users[i]);
//         }
//         console.info('============= END : Initialize Ledger ===========');

//         // Disconnect from the gateway.
//         await gateway.disconnect();

//     } catch (error) {
//         console.error(`Failed to submit transaction: ${error}`);
//         process.exit(1);
//     }
// }
// main();

const invokeTransaction = async (
  channelName,
  chaincodeName,
  fcn,
  args,
  username,
  org_name
) => {
  try {
    logger.debug(
      util.format(
        "\n============ invoke transaction on channel %s ============\n",
        channelName
      )
    );

    const users = {
      name: args[0],
      address: args[1],
      units: args[2],
    };
    const ccp = await helper.getCCP(org_name);

    // Create a new file system based wallet for managing identities.
    const walletPath = await helper.getWalletPath(org_name); //path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    let identity = await wallet.get(username);
    if (!identity) {
      console.log(
        `An identity for the user ${username} does not exist in the wallet, so registering user`
      );
      await helper.getRegisteredUser(username, org_name, true);
      identity = await wallet.get(username);
      console.log("Run the registerUser.js application before retrying");
      return;
    }

    const connectOptions = {
      wallet,
      identity: username,
      discovery: { enabled: true, asLocalhost: true },
    };

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, connectOptions);

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork(channelName);

    const contract = network.getContract(chaincodeName);
    let content = JSON.parse(fs.readFileSync("./config/idgen.json", "utf8"));
    // edit or add property

    //write file

    let result;
    let message;
    if (fcn === "writeData") {
      result = await contract.submitTransaction(
        fcn,
        "uid" + content.id,
        Buffer.from(JSON.stringify(users))
      );

      message = `Successfully added the user asset with key ${args[0]}`;
      content.id++;
      fs.writeFileSync("./config/idgen.json", JSON.stringify(content));
    } else {
      return `Invocation require either writeData as function but got ${fcn}`;
    }

    await gateway.disconnect();

    result = JSON.parse(result.toString());

    let response = {
      message: message,
      result,
    };

    return response;
  } catch (error) {
    console.log(`Getting error: ${error}`);
    return error.message;
  }
};

const invokeMeterUnits = async (
  channelName,
  chaincodeName,
  fcn,
  args,
  username,
  org_name,
  uid
) => {
  try {
    logger.debug(
      util.format(
        "\n============ invoke transaction on channel %s ============\n",
        channelName,
        chaincodeName,
        fcn,
        args,
        username,
        org_name,
        uid
      )
    );

    const users = {
      name: args[0],
      address: args[1],
      units: args[2],
    };
    // load the network configuration
    const ccpPath = path.resolve(
      __dirname,
      "..",
      "..",
      "test-network",
      "organizations",
      "peerOrganizations",
      "org1.example.com",
      "connection-org1.json"
    );
    let ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get(username);
    if (!identity) {
      console.log(
        `An identity for the user ${username} does not exist in the wallet`
      );
      console.log("Run the registerUser.js application before retrying");
      return;
    }

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: username,
      discovery: { enabled: true, asLocalhost: true },
    });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork("mychannel");

    // Get the contract from the network.
    const contract = network.getContract("electricLadger");

    // edit or add propert

    let result;
    let message;
    if (fcn === "writeData") {
      result = await contract.submitTransaction(
        "writeData",
        uid,
        Buffer.from(JSON.stringify(users))
      );

      message = `Successfully added the units of ${uid} `;
    } else {
      return `Invocation require either writeData as function but got ${fcn}`;
    }

    gateway.disconnect();

    return message;
  } catch (error) {
    console.log(`Getting error: ${error}`);
    return error.message;
  }
};

const invokeUnitsPrices = async (
  channelName,
  chaincodeName,
  fcn,
  args,
  username,
  org_name
) => {
  try {
    ``;
    logger.debug(
      util.format(
        "\n============ invoke transaction on channel %s ============\n",
        channelName
      )
    );

    const prices = {
      unitPrice: args[0],
      tax: args[1],
      servicesCharges: args[2],
    };
    const ccp = await helper.getCCP(org_name);
    // Create a new file system based wallet for managing identities.
    const walletPath = await helper.getWalletPath(org_name); //path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    let identity = await wallet.get(username);
    if (!identity) {
      console.log(
        `An identity for the user ${username} does not exist in the wallet, so registering user`
      );
      await helper.getRegisteredUser(username, org_name, true);
      identity = await wallet.get(username);
      console.log("Run the registerUser.js application before retrying");
      return;
    }

    const connectOptions = {
      wallet,
      identity: username,
      discovery: { enabled: true, asLocalhost: true },
    };

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, connectOptions);

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork(channelName);

    const contract = network.getContract(chaincodeName);

    // edit or add propert

    let result;
    let message;
    if (fcn === "writeData") {
      result = await contract.submitTransaction(
        "writeData",
        "unitPrices",
        Buffer.from(JSON.stringify(prices))
      );

      message = `Successfully added the Prices for this month`;
    } else {
      return `Invocation require either writeData as function but got ${fcn}`;
    }

    gateway.disconnect();

    result = JSON.parse(result.toString());

    let response = {
      message: message,
      result,
    };

    return response;
  } catch (error) {
    console.log(`Getting error: ${error}`);
    return error.message;
  }
};

module.exports = {
  invokeTransaction: invokeTransaction,
  invokeUnitsPrices: invokeUnitsPrices,
  invokeMeterUnits: invokeMeterUnits,
};
