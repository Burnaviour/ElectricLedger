
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
    async queryData(ctx,uid){
        let queryString={};
        queryString.selector={"_id":uid}
        let iterator=await ctx.stub.getQueryResult(JSON.stringify(queryString));
        let result =await this.iteratorData(iterator,false);
        return JSON.stringify(result);


    }

    async GetAssetHistory(ctx, assetName) {

		let resultsIterator = await ctx.stub.getHistoryForKey(assetName);
		let results = await this.iteratorData(resultsIterator, true);

		return JSON.stringify(results);
	}
    async iteratorData(iterator,isHistory){
        let resArray = [];

        while(true){
        let res=await iterator.next();
        let response={};
          
        if(res.value && res.value.value.toString()){

             if (isHistory && isHistory === true) {
            response.TxId = res.value.txId;
            response.Timestamp = res.value.timestamp;
            try {
                response.Value = JSON.parse(res.value.value.toString('utf8'));
               
            } catch (err) {
                console.log(err);
                response.Value = res.value.value.toString('utf8');
            }}
        else { 
            response.key=res.value.key;
            response.value = JSON.parse(res.value.value.toString('utf8'));
           
        }
        resArray.push(response);
        }
        if (res.done) {
            await iterator.close();
            return resArray;
            
        }

        }}



}

module.exports = ElectricLadger;
