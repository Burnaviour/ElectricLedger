"use strict";

const bodyParser = require("body-parser");
const http = require("http");
const util = require("util");
const express = require("express");
const app = express();
const path = require("path");
const expressJWT = require("express-jwt");
const jwt = require("jsonwebtoken");
const invoke = require("./invoke");
// const { expressJWT: jwt } = require("express-jwt");
const bearerToken = require("express-bearer-token");
const cors = require("cors");
const constants = require("./config/constants.json");

const host = process.env.HOST || constants.host;
const port = process.env.PORT || constants.port;
const log4js = require("log4js");
var logger = log4js.getLogger("electricLadger");
const helper = require("./helper");
const query = require("./query");
const getData = require("./getData");
const fs = require("fs");
const { json } = require("body-parser");
app.options("*", cors());
app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
// set secret variable
app.set("secret", "thisismysecret");
app.use(
  expressJWT({
    secret: "thisismysecret",
  }).unless({
    path: ["/users", "/users/login", "/admin/login", "/register", "/admin/register"],
  })
);
app.use(bearerToken());

logger.level = "debug";

app.use((req, res, next) => {
  logger.debug("New req for %s", req.originalUrl);
  if (
    req.originalUrl.indexOf("/admin/login") >= 0 ||
    req.originalUrl.indexOf("/users/login") >= 0 ||
    req.originalUrl.indexOf("/register") >= 0
  ) {
    return next();
  }
  var token = req.token;
  jwt.verify(token, app.get("secret"), (err, decoded) => {
    if (err) {
      console.log(`Error ================:${err}`);
      res.send({
        success: false,
        message:
          "Failed to authenticate token. Make sure to include the " +
          "token returned from /users call in the authorization header " +
          " as a Bearer token",
      });
      return;
    } else {
      req.username = decoded.username;
      req.orgname = decoded.orgName;
      logger.debug(
        util.format(
          "Decoded from JWT token: username - %s, orgname - %s",
          decoded.username,
          decoded.orgName
        )
      );
      return next();
    }
  });
});

var server = http.createServer(app).listen(port, function () {
  console.log(`Server started on ${port}`);
});
logger.info("****************** SERVER STARTED ************************");
logger.info("***************  http://%s:%s  ******************", host, port);
server.timeout = 240000;

function getErrorMessage(field) {
  var response = {
    success: false,
    message: field + " field is missing or Invalid in the request",
  };
  return response;
}

// Register and enroll user
app.post("/register", async function (req, res) {
  var username = req.body.username;
  var orgName = req.body.orgName;
  var type = req.body.type;
  var cnic = req.body.cnic
  var uid = req.body.uid
  logger.debug("End point : /register");
  logger.debug("User name : " + username);
  logger.debug("Org name  : " + orgName);
  logger.debug("cnic : " + cnic);
  logger.debug("uid : " + uid);
  logger.debug("type  : " + type + " type is " + typeof type);
  if (!username) {
    res.json(getErrorMessage("'username'"));
    return;
  }
  if (!orgName || orgName === "none") {
    res.json(getErrorMessage("'orgName'"));
    return;
  }
  if (!cnic) {
    res.json(getErrorMessage("'cnic'"));
    return;
  }
  if (!uid) {
    res.json(getErrorMessage("'uid'"));
    return;
  }

  var token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
      username: username,
      orgName: orgName,
    },
    app.get("secret")
  );

  username = username.trim();
  cnic = cnic.trim();
  uid = uid.trim();

  if (type === "user") {
    let message = await query.query(
      "mychannel",
      "electricLadger",
      uid,
      "queryData",
      "appUser",
      "Org1"
    );
    if (message[0]) {
      console.log((message[0]));
      if (message[0].key === uid && message[0].value.cnic === cnic) {
        let isUserRegistered = await helper.isUserRegistered(username, orgName);
        if (isUserRegistered) {
          let response = {
            success: true,
            username: username,
            IsNewUser: false,
            message: username + " is already exist in the wallet Successfully",
            token: token,
          };
          res.json(response);
          return;
        }
        //Register the user, enroll the user, and import the new identity into the wallet.

        let response = await helper.getRegisteredUser(username, orgName, true);

        logger.debug(
          "-- returned from registering the username %s for organization %s",
          username,
          orgName
        );
        if (response && typeof response !== "string") {
          logger.debug(
            "Successfully registered the username %s for organization %s",
            username,
            orgName
          );
          response.IsNewUser = true;
          response.token = token;
          response.username = username;

          res.json(response);
          return;
        } else {
          logger.debug(
            "Failed to register the username %s for organization %s with::%s",
            username,
            orgName,
            response
          );
          res.json({ success: false, message: response });
          return

        }

      }
      let response = {
        success: false,
        message: "Given Cnic and Uid didn't not Found please provide correct info",
      };
      res.json(response)

      return
    }
    let response = {
      success: false,
      message: uid + " not found please request for new Connection first !",
    };
    res.json(response)
    return;

  }



});
// Register and enroll user
app.post("/admin/register", async function (req, res) {
  var username = req.body.username;
  var orgName = req.body.orgName;

  logger.debug("End point : admin/register");
  logger.debug("User name : " + username);
  logger.debug("Org name  : " + orgName);

  if (!username) {
    res.json(getErrorMessage("'username'"));
    return;
  }
  if (!orgName || orgName === "none") {
    res.json(getErrorMessage("'orgName'"));
    return;
  }

  var token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
      username: username,
      orgName: orgName,
    },
    app.get("secret")
  );

  let isUserRegistered = await helper.isUserRegistered(username, orgName);
  if (isUserRegistered) {

    var walletFilePath = path.join(__dirname, 'wallet', username + '.id');
    var walletFile = fs.readFileSync(walletFilePath);
    res.setHeader("Content-disposition", "attachment; filename=" + username + ".id");
    res.set("Content-Type", "application/json");
    let response = {
      success: true,
      username: username,
      IsNewUser: false,
      message: username + " is already exist in the wallet Successfully",
      token: token,
      walletFile: walletFile,
      walletmsg: "Your wallet file has been saved. You can now log in using your credentials.",
    };
    res.json(response);
    return;
  }
  //Register the user, enroll the user, and import the new identity into the wallet.

  let response = await helper.getRegisteredUser(username, orgName, true);

  logger.debug(
    "-- returned from registering the username %s for organization %s",
    username,
    orgName
  );
  if (response && typeof response !== "string") {
    logger.debug(
      "Successfully registered the username %s for organization %s",
      username,
      orgName
    );
    response.IsNewUser = true;
    response.token = token;
    response.username = username;
    // Get the user's wallet file
    var walletFilePath = path.join(__dirname, 'wallet', username + '.id');
    var walletFile = fs.readFileSync(walletFilePath);
    // Send the wallet file, message, and success flag to the user
    res.setHeader("Content-disposition", "attachment; filename=" + username + ".id");
    res.set("Content-Type", "application/json");
    response.walletFile = walletFile;
    response.walletmsg = "Your wallet file has been saved. You can now log in using your credentials.",
      res.json(response);
  } else {
    logger.debug(
      "Failed to register the username %s for organization %s with::%s",
      username,
      orgName,
      response
    );
    res.json({ success: false, message: response });
  }
});

//######################################## Admin Login wallet File check #################################
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now());
  }
});

const upload = multer({ dest: 'uploads/' });
app.post("/api/verifyWallet", upload.single('file'), async function (req, res) {
  //Get the path of the file on the server
  var username = req.body.username
  var uploadedFile = req.file
  var uploadedFileContent = fs.readFileSync(uploadedFile.path);
  var walletFilePath = path.join(__dirname, 'wallet', username + '.id');
  var walletFile = fs.readFileSync(walletFilePath);
  // Read the contents of the file on the server

  if (uploadedFileContent.toString() === walletFile.toString()) {
    console.log(username)
    const response_payload = { success: true, message: "Succesfully Verified " };
    logger.debug("\nData send :", response_payload);
    res.status(200).send(response_payload);
    fs.unlink(uploadedFile.path, (err) => {
      if (err) throw err;
      console.log(`${uploadedFile.path} was deleted`);
    });
    return;
  }
  else {
    const response_payload = { success: false, message: 'File does not match.Please provide correct wallet file to login ' };
    logger.debug("\nData send :", response_payload);
    res.send(response_payload);
    fs.unlink(uploadedFile.path, (err) => {
      if (err) throw err;
      console.log(`${uploadedFile.path} was deleted`);
    });

    return;
  }



});

// Login and get jwt

app.post("/users/login", async function (req, res) {
  var username = req.body.username;
  var orgName = req.body.orgName;
  var type = req.body.type;
  var cnic = req.body.cnic
  var uid = req.body.uid
  logger.debug("End point : /users/login");
  logger.debug("User name : " + username);
  logger.debug("Org name  : " + orgName);
  if (!username) {
    res.json(getErrorMessage("'username'"));
    return;
  }
  if (!orgName || orgName === "none") {
    res.json(getErrorMessage("'orgName'"));
    return;
  }
  if (!cnic) {
    res.json(getErrorMessage("'cnic'"));
    return;
  }
  if (!uid) {
    res.json(getErrorMessage("'uid'"));
    return;
  }

  username = username.trim();
  cnic = cnic.trim();
  uid = uid.trim();
  if (type === "user") {
    let message = await query.query(
      "mychannel",
      "electricLadger",
      uid,
      "queryData",
      "appUser",
      "Org1"
    );
    //to show prices on user dashboard
    let prices = await query.query(
      "mychannel",
      "electricLadger",
      "unitPrices",
      "queryData",
      "appUser",
      "Org1"
    );
    console.log(prices);

    if (message[0]) {

      if (message[0].key === uid && message[0].value.cnic === cnic) {

        var token = jwt.sign(
          {
            exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
            username: username,
            orgName: orgName,
          },
          app.get("secret")
        );
        let isUserRegistered = await helper.isUserRegistered(username, orgName);

        //Register the user, enroll the user, and import the new identity into the wallet.
        if (isUserRegistered) {
          res.json({ success: true, token: token, username: username, orgName: orgName, prices: prices[0].value });
          return;
        } else {
          logger.debug(`user ${username} does not exist `);
          res.json({
            success: false,
            message: `User with username ${username} is not registered with ${orgName}, Please register first.`,
          }
          );
          return;
        }




      }
      let response = {
        success: false,
        message: "Given Cnic and uid didn't not Found please provide correct info",
      };
      res.json(response)

      return
    }
    let response = {
      success: false,
      message: uid + " not found.Please check your given Uid!",
    };
    res.json(response)
    return;

  }




});

//admin login
// Login and get jwt
app.post("/admin/login", async function (req, res) {
  var username = req.body.username;
  var orgName = req.body.orgName;
  logger.debug("End point : /admin/login");
  logger.debug("User name : " + username);
  logger.debug("Org name  : " + orgName);
  if (!username) {
    res.json(getErrorMessage("'username'"));
    return;
  }
  if (!orgName || orgName === "none") {
    res.json(getErrorMessage("'orgName'"));
    return;
  }

  var token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
      username: username,
      orgName: orgName,
    },
    app.get("secret")
  );

  let isUserRegistered = await helper.isUserRegistered(username, orgName);

  if (isUserRegistered) {
    res.json({ success: true, token: token, username: username });
  } else {
    logger.debug(`user ${username} does not exist `);
    res.json({
      success: false,
      message: `User with username ${username} is not registered with ${orgName}, Please register first.`,
    });
  }
});
//"==================== INVOKE ON CHAINCODE =================="
// Invoke transaction on chaincode on target peers
app.post(
  "/channels/:channelName/chaincodes/:chaincodeName/invoke",
  async function (req, res) {
    try {
      logger.debug(
        "==================== INVOKE ON CHAINCODE =================="
      );

      var chaincodeName = req.params.chaincodeName;
      var channelName = req.params.channelName;
      var fcn = req.body.fcn;
      var name = req.body.name;
      var address = req.body.address
      var units = req.body.units;
      var cnic = req.body.cnic;
      logger.debug("channelName  : " + channelName);
      logger.debug("chaincodeName : " + chaincodeName);
      logger.debug("fcn  : " + fcn);
      logger.debug("name  : " + name);
      logger.debug("address  : " + address);
      logger.debug("units  : " + units);
      logger.debug("cnic  : " + cnic);
      if (!chaincodeName) {

        res.json(getErrorMessage("'chaincodeName'"));
        return;
      }
      if (!channelName) {
        res.json(getErrorMessage("'channelName'"));
        return;
      }
      if (!fcn) {
        res.json(getErrorMessage("'fcn'"));
        return;
      }
      if (!cnic.trim()) {
        res.json(getErrorMessage("'cnic'"));
        return;
      }
      if (!address.trim()) {
        res.json(getErrorMessage("'address'"));
        return;
      }
      if (!name.trim()) {
        res.json(getErrorMessage("'name'"));
        return;
      }
      name = name.trim();
      address = address.trim();
      cnic = cnic.trim();
      let message = await invoke.invokeTransaction(
        channelName,
        chaincodeName,
        fcn,
        [name, address, cnic],
        req.username,
        req.orgname
      );

      const response_payload = {
        result: message,
        success: true,
        error: null,
        errorData: null,
      };
      res.send(response_payload);
      return;
    } catch (error) {
      const response_payload = {
        result: null,
        success: false,
        error: error.name,
        errorData: error.message,
      };
      res.send(response_payload);
    }
  }
);

//#######################invoke update user data chaincode ###################
app.post(
  "/channels/:channelName/chaincodes/:chaincodeName/invokeuserdata",
  async function (req, res) {
    try {
      logger.debug(
        "==================== INVOKE ON CHAINCODE =================="
      );
      var chaincodeName = req.params.chaincodeName;
      var channelName = req.params.channelName;
      var fcn = req.body.fcn;
      var name = req.body.name;
      var address = req.body.address
      var cnic = req.body.cnic;
      var uid = req.body.uid;
      logger.debug("channelName  : " + channelName);
      logger.debug("chaincodeName : " + chaincodeName);
      logger.debug("fcn  : " + fcn);
      logger.debug("name  : " + name);
      logger.debug("address  : " + address);
      logger.debug("cnic  : " + cnic);
      logger.debug("uid  : " + uid);
      if (!chaincodeName) {

        res.json(getErrorMessage("'chaincodeName'"));
        return;
      }
      if (!channelName) {
        res.json(getErrorMessage("'channelName'"));
        return;
      }
      if (!uid) {
        res.json(getErrorMessage("'uid'"));
        return;
      }
      if (!fcn) {
        res.json(getErrorMessage("'fcn'"));
        return;
      }
      if (!cnic.trim()) {
        res.json(getErrorMessage("'cnic'"));
        return;
      }
      if (!address.trim()) {
        res.json(getErrorMessage("'address'"));
        return;
      }
      if (!name.trim()) {
        res.json(getErrorMessage("'name'"));
        return;
      }
      name = name.trim();
      address = address.trim();
      cnic = cnic.trim();
      uid = uid.trim();
      let prevData = await query.query(
        "mychannel",
        "electricLadger",
        uid,
        "queryData",
        "appUser",
        "Org1"
      );


      if (prevData[0]) {

        if (prevData[0].key === uid) {
          let message = await invoke.invokeUpdateData(
            channelName,
            chaincodeName,
            fcn,
            [name, address, cnic, prevData[0].value.units, uid],
            req.username,
            req.orgname
          );
          let response = {
            success: true,
            result: message.result,
            message: message.message
          };
          logger.debug(`successfully updated user ${name}'s data `);
          res.json(response)
          return;
        }
      }
      let response = {
        success: false,
        message: uid + " not found.Please check your given Uid!",
      };
      res.json(response)
      return;
    } catch (error) {
      const response_payload = {
        result: null,
        success: false,
        error: error.name,
        errorData: error.message,
      };
      res.send(response_payload);
      logger.debug(`got error ${error} `);
      return
    }
  }
);


// "==================== QUERY BY CHAINCODE =================="
app.get(
  "/channels/:channelName/chaincodes/:chaincodeName",
  async function (req, res) {
    try {
      logger.debug(
        "==================== QUERY BY CHAINCODE =================="
      );

      var channelName = req.params.channelName;
      var chaincodeName = req.params.chaincodeName;
      console.log(`chaincode name is :${chaincodeName}`);
      let args = req.query.args;
      let fcn = req.query.fcn;
      let history = req.query.history;

      logger.debug("channelName : " + channelName);
      logger.debug("chaincodeName : " + chaincodeName);
      logger.debug("fcn : " + fcn);
      logger.debug("args : " + args);
      logger.debug("history : " + history);
      console.log(typeof history);
      if (!chaincodeName) {
        res.json(getErrorMessage("'chaincodeName'"));
        return;
      }
      if (!channelName) {
        res.json(getErrorMessage("'channelName'"));
        return;
      }
      if (!fcn) {
        res.json(getErrorMessage("'fcn'"));
        return;
      }
      if (!args) {
        res.json(getErrorMessage("'args'"));
        return;
      }
      console.log("args==========", args);
      args = args.replace(/'/g, '"');
      args = JSON.parse(args);

      logger.debug(args[0]);
      if (!args) {
        const response_payload = {
          result: message,
          error: null,
          errorData: null,
        };
        res.send(response_payload);
      }
      let message = await query.query(
        channelName,
        chaincodeName,
        args[0],
        fcn,
        req.username,
        "Org1"
      );
      if (history === "true") {
        let message2 = await query.queryHistoruData(
          channelName,
          chaincodeName,
          args[0],
          req.username,
          "Org1"
        );
        const response_payload = {
          result: message,
          history: message2,
          error: null,
          errorData: null,
          Ishistory: true,
        };
        console.log(response_payload);
        res.send(response_payload);
        return;
      }

      const response_payload = {
        result: message,
        error: null,
        errorData: null,
        Ishistory: false,
      };

      res.send(response_payload);
    } catch (error) {
      const response_payload = {
        result: null,
        error: error.name,
        errorData: error.message,
      };
      res.send(response_payload);
    }
  }
);


// "==================== Invoke prices BY CHAINCODE =================="######################################
app.post(
  "/channels/:channelName/chaincodes/:chaincodeName/setPrices",

  async (req, res) => {
    logger.debug(
      "==================== Invoke prices BY CHAINCODE =================="
    );
    var chaincodeName = req.params.chaincodeName;
    var channelName = req.params.channelName;
    var unitsPrice = req.body.unitsPrice;
    var Service = req.body.Service;
    var tax = req.body.tax;

    logger.debug("channelName  : " + channelName);
    logger.debug("chaincodeName : " + chaincodeName);
    logger.debug("unitsPrice  : " + unitsPrice);
    logger.debug("Service  : " + Service);
    logger.debug("tax  : " + tax);
    if (!unitsPrice || !Service || !tax) {
      const response_payload = {
        message: "please fill all the fields given",
        success: false,
        error: null,
        errorData: null,
      };

      res.send(response_payload);
    }
    let message = await invoke.invokeUnitsPrices(
      channelName,
      chaincodeName,
      "writeData",
      [unitsPrice, tax, Service],
      req.username,
      "Org1"
    );
    if (message) {
      const response_payload = {
        result: message,
        success: true,
        error: null,
        errorData: null,
      };
      logger.debug("Data Send Sccess  : ", response_payload);
      res.send(response_payload);
      return;
    } else {
      const response_payload = {
        result: message,
        success: false,
        error: null,
        message: "there was an error while doing transaction ",
        errorData: null,
      };
      logger.debug("Data Send failed  : ", response_payload);
      res.send(response_payload);
      return;
    }
  }
);

// "==================== QUERY get bill BY CHAINCODE =================="
app.get(
  "/channels/:channelName/chaincodes/:chaincodeName/getbill",
  async function (req, res) {
    try {
      logger.debug(
        "==================== QUERY get bill BY CHAINCODE =================="
      );

      var channelName = req.params.channelName;
      var chaincodeName = req.params.chaincodeName;
      console.log(`chaincode name is :${chaincodeName}`);
      let args = req.query.args;
      let fcn = req.query.fcn;
      let history = req.query.history;
      logger.debug("channelName : " + channelName);
      logger.debug("chaincodeName : " + chaincodeName);
      logger.debug("fcn : " + fcn);
      logger.debug("args : " + args);

      if (!chaincodeName) {
        res.json(getErrorMessage("'chaincodeName'"));
        return;
      }
      if (!channelName) {
        res.json(getErrorMessage("'channelName'"));
        return;
      }
      if (!fcn) {
        res.json(getErrorMessage("'fcn'"));
        return;
      }
      if (!args) {
        res.json(getErrorMessage("'args'"));
        return;
      }
      console.log("args==========", args);
      args = args.replace(/'/g, '"');
      args = JSON.parse(args);

      logger.debug(args[0]);
      if (!args) {
        const response_payload = {
          result: message,
          error: null,
          errorData: null,
        };
        res.send(response_payload);
      }

      if (history === "true") {
        let message2 = await query.query(
          channelName,
          chaincodeName,
          args[0],
          fcn,
          req.username,
          "Org1"
        );

        let message1 = await query.query(
          channelName,
          chaincodeName,
          "unitPrices",
          fcn,
          req.username,
          "Org1"
        );
        let message = await query.queryHistoruData(
          channelName,
          chaincodeName,
          args[0],
          req.username,
          "Org1"
        );
        // console.log(message);
        // console.log(message1);
        let result = message && message1 && getData.getData(message, message1);
        if (result) {
          console.log(result);
          const response_payload = {
            success: true,
            uid: message2[0].key,
            name: message2[0].value.name,
            address: message2[0].value.address,
            result: result,
            unitPrice: message1[0].value.unitPrice,
            ServiceCharges: message1[0].value.servicesCharges,
            tax: result.tax,
            error: null,
            errorData: null,
            Ishistory: true,
          };

          res.send(response_payload);
        } else {
          const response_payload = {
            success: false,
            result: "user not Found Please Enter valid user id ",
            error: null,
            errorData: null,
            Ishistory: true,
          };
          console.log(response_payload);
          res.send(response_payload);
        }

        return;
      }
    } catch (error) {
      const response_payload = {
        result: null,
        error: error.name,
        errorData: error.message,
      };
      res.send(response_payload);
    }
  }
);

//////////////////////////////////LATER USE FOR WALLLET ID GET REQUEST//////////////////////////////////
// app.get("/api/login", (req, res) => {
//   const filePath = `/home/lightyagami/fabric-samples/electricLadger/javascript/wallet/${req.query.name}.id`;
//   fs.access(filePath, fs.constants.F_OK, (error) => {
//     if (error) {
//       // The file was not found
//       res.status(404).send({ error: "User not found" });
//     } else {
//       // The file was found
//       fs.readFile(filePath, (error, data) => {
//         if (error) {
//           res.status(500).send({ error: "Error reading file" });
//         } else {
//           res.send(data);
//         }
//       });
//     }
//   });
// });

// const fs = require("fs");

// // Read the wallet ID file
// fs.readFile("/path/to/walletIDFile", (err, data) => {
//   if (err) {
//     // Handle the error
//   }

//   // Return the wallet ID file to the client
//   res.json({
//     success: true,
//     walletIDFile: data,
//   });
// });

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// app.get('/qscc/channels/:channelName/chaincodes/:chaincodeName', async function (req, res) {
//     try {
//         logger.debug('==================== QUERY BY CHAINCODE ==================');

//         var channelName = req.params.channelName;
//         var chaincodeName = req.params.chaincodeName;
//         console.log(`chaincode name is :${chaincodeName}`)
//         let args = req.query.args;
//         let fcn = req.query.fcn;
//         // let peer = req.query.peer;

//         logger.debug('channelName : ' + channelName);
//         logger.debug('chaincodeName : ' + chaincodeName);
//         logger.debug('fcn : ' + fcn);
//         logger.debug('args : ' + args);

//         if (!chaincodeName) {
//             res.json(getErrorMessage('\'chaincodeName\''));
//             return;
//         }
//         if (!channelName) {
//             res.json(getErrorMessage('\'channelName\''));
//             return;
//         }
//         if (!fcn) {
//             res.json(getErrorMessage('\'fcn\''));
//             return;
//         }
//         if (!args) {
//             res.json(getErrorMessage('\'args\''));
//             return;
//         }
//         console.log('args==========', args);
//         args = args.replace(/'/g, '"');
//         args = JSON.parse(args);
//         logger.debug(args);

//         let response_payload = await qscc.qscc(channelName, chaincodeName, args, fcn, req.username, req.orgname);

//         // const response_payload = {
//         //     result: message,
//         //     error: null,
//         //     errorData: null
//         // }

//         res.send(response_payload);
//     } catch (error) {
//         const response_payload = {
//             result: null,
//             error: error.name,
//             errorData: error.message
//         }
//         res.send(response_payload)
//     }
// });
