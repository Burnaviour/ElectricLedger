"use strict";

const { Contract } = require("fabric-contract-api");

class ElectricLedger extends Contract {
  // async initLedger(ctx) {

  // const users = [
  //                    {

  //                     name:'Ali',
  //                     address:'korangi',
  //                     units:20

  //                    },
  //                    {
  //                     name:'moiz',
  //                     address:'malir cent',
  //                     units:50

  //                    },
  //                    {
  //                     name:'akbar',
  //                     address:'clifton ',
  //                     units:70

  //                    },
  //                    {
  //                     name:'tayyab',
  //                     address:'clifton ',
  //                     units:7000

  //                    },
  //                    {
  //                     name:'muzafar',
  //                     address:'clifton ',
  //                     units:70

  //                    },
  //                    {
  //                     name:'nawaz ali',
  //                     address:'clifton ',
  //                     units:7000

  //                    }

  //                 ];

  //                 for (let i = 0; i < users.length; i++) {
  //                     users[i].docType = 'Users';
  //                     await ctx.stub.putState('uid'+i, Buffer.from(JSON.stringify(users[i])));

  //                     console.info('Added <--> ', users[i]);
  //                 }
  //                 console.info('============= END : Initialize Ledger ===========');

  //    return "success";
  // }
  async initLedger(ctx) {
    const users = [
      {
        name: "Ali",
        address: "korangi",
        units: 20,

        cnic: "35201-35202",
      },
      {
        name: "moiz",
        address: "malir cent",
        units: 50,

        cnic: "35201-35203",
      },
      {
        name: "akbar",
        address: "clifton ",
        units: 70,

        cnic: "35201-35209",
      },
      {
        name: "tayyab",
        address: "clifton ",
        units: 7000,

        cnic: "35201-35207",
      },
      {
        name: "muzafar",
        address: "clifton ",
        units: 70,


        cnic: "35201-35205",
      },
      {
        name: "nawaz ali",
        address: "clifton ",
        units: 7000,

        cnic: "35201-35102",
      },
    ];

    const prices = {
      unitPrice: 30,
      tax: 0.17,
      servicesCharges: 100,
      uid: "unitPrices",
    };

    for (let i = 0; i < users.length; i++) {
      users[i].docType = "Users";
      await ctx.stub.putState("uid" + i, Buffer.from(JSON.stringify(users[i])));

      console.info("Added <--> ", users[i]);
    }

    await ctx.stub.putState("unitPrices", Buffer.from(JSON.stringify(prices)));
    console.info("============= END : Initialize Ledger ===========");

    return "success";
  }
  async writeData(ctx, key, value) {
    await ctx.stub.putState(key, value);
    return value;
  }
  async readData(ctx, key) {
    var response = await ctx.stub.getState(key);
    return response.toString();
  }
  async queryAllData(ctx) {
    const startKey = "";
    const endKey = "";
    const allResults = [];
    for await (const { key, value } of ctx.stub.getStateByRange(
      startKey,
      endKey
    )) {
      const strValue = Buffer.from(value).toString("utf8");
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
  async queryData(ctx, uid) {
    let queryString = {};
    queryString.selector = { "_id": uid };
    let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    let result = await this.iteratorData(iterator, false);
    return JSON.stringify(result);
  }

  async GetAssetHistory(ctx, assetName) {
    let resultsIterator = await ctx.stub.getHistoryForKey(assetName);
    let results = await this.iteratorData(resultsIterator, true);

    return JSON.stringify(results);
  }
  async iteratorData(iterator, isHistory) {
    let resArray = [];

    while (true) {
      let res = await iterator.next();
      // console.log(res.value.value.toString('utf8'));
      let response = {};

      if (res.value && res.value.value.toString()) {
        if (isHistory && isHistory === true) {

          console.log("response in history block :", res.value.toString("utf8"))


          response.TxId = res.value.txId;

          // response.IsDelete = res.value.is_delete.toString();
          response.Timestamp = res.value.timestamp;

          try {
            response.Value = JSON.parse(res.value.value.toString("utf8"));
          } catch (err) {
            console.log(err);
            response.Value = res.value.value.toString("utf8");
          }
        } else {
          console.log("response is in else block:", res)
          response.key = res.value.key;
          response.value = JSON.parse(res.value.value.toString("utf8"));
        }
        resArray.push(response);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(resArray);
        return resArray;
      }
    }
  }
}

module.exports = ElectricLedger;
