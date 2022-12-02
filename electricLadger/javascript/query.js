

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const helper = require('./helper')

// async function main(){
//    // load the network configuration
  
// }
// main();


async function queryData(channelName, chaincodeName, args, fcn, username, org_name) {
    try {
        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
        
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        // Evaluate the specified transaction.
       
        // const result = await contract.evaluateTransaction('queryAllData');
        // console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        // const result2 = await contract.evaluateTransaction('readData',"user2");
        // console.log(`Transaction has been evaluated, result is: ${result2.toString()}`);
        // const result3 = await contract.evaluateTransaction('readData',"user3");
        // console.log(`Transaction has been evaluated, result is: ${result3.toString()}`);
        // const result = await contract.evaluateTransaction('queryData',myquery);
        let result = await contract.evaluateTransaction(fcn,args);
        let result1 = await contract.evaluateTransaction('GetAssetHistory','uid3');
        console.log(`Transaction has been evaluated, result is: ${result}`);
        console.log(`Transaction has been evaluated, History is: ${result1}`);
        result = JSON.parse(result.toString());
        // Disconnect from the gateway.
        await gateway.disconnect();
        return  result;
        
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

async function queryHistory(channelName, chaincodeName, args, username, org_name){
    try {
        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
        
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result = await contract.evaluateTransaction('GetAssetHistory',args);
        
        result = JSON.parse(result.toString());
        // Disconnect from the gateway.
        await gateway.disconnect();
        return  result;
        
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }

}

module.exports={

    query:queryData,
    queryHistoruData:queryHistory
}
