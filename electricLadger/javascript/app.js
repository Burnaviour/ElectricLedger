var express = require('express');
var query=require('./query.js');
var app = express();
var bodyParser = require("body-parser");
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
  //      const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

app.get('/api/queryAllData', async function (req, res)  {
     try {
        let myquery=req.body["uname"];
    

        //var result =await query.query(myquery);

        // console.info();
        // // res.send(JSON.stringify());
        // res.send(JSON.parse(result.toString('utf-8')));
} catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(400).json({error: error});
        process.exit(1);
    }
});
app.post('/api/queryData', async function (req, res)  {
    try {
       let myquery=req.body["uname"];
       console.log(myquery);

       var result =await query.query(myquery);

       res.send(JSON.parse(result.toString('utf-8')));
} catch (error) {
       console.error(`Failed to evaluate transaction: ${error}`);
       res.status(400).json({error: error});
       process.exit(1);
   }
});


app.listen(3000);
