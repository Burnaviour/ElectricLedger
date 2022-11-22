

'use strict';

const { Contract } = require('fabric-contract-api');

class ElectricLadger extends Contract {

    async initLedger(ctx) {
    await ctx.stub.putState("test","Hello World");
       return "success";
    }
    async writeData(ctx,key,value){
        await ctx.stub.putState(key,value);
        return value;

    }
    async readData(ctx,key){
        var response =await ctx.stub.getState(key);
        return response.toString();
        
        
    }
    async queryAllData(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }



}

module.exports = ElectricLadger;
