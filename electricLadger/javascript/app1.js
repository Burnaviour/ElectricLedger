"use strict";

const bodyParser = require("body-parser");
const http = require("http");
const util = require("util");
const express = require("express");
const app = express();
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
    path: ["/users", "/users/login", "/register"],
  })
);
app.use(bearerToken());

logger.level = "debug";

app.use((req, res, next) => {
  logger.debug("New req for %s", req.originalUrl);
  if (
    req.originalUrl.indexOf("/users") >= 0 ||
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
  logger.debug("End point : /users");
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

// Login and get jwt
app.post("/users/login", async function (req, res) {
  var username = req.body.username;
  var orgName = req.body.orgName;
  logger.debug("End point : /users");
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

// Invoke transaction on chaincode on target peers
app.post(
  "/channels/:channelName/chaincodes/:chaincodeName",
  async function (req, res) {
    try {
      logger.debug(
        "==================== INVOKE ON CHAINCODE =================="
      );

      var chaincodeName = req.params.chaincodeName;
      var channelName = req.params.channelName;
      var fcn = req.body.fcn;
      var args = req.body.args;

      logger.debug("channelName  : " + channelName);
      logger.debug("chaincodeName : " + chaincodeName);
      logger.debug("fcn  : " + fcn);
      logger.debug("args  : " + args);
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

      let message = await invoke.invokeTransaction(
        channelName,
        chaincodeName,
        fcn,
        args,
        req.username,
        req.orgname
      );
      console.log(`message result is : ${message}`);

      const response_payload = {
        result: message,
        error: null,
        errorData: null,
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

//######################################
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

      res.send(response_payload);
    } else {
      const response_payload = {
        result: message,
        success: false,
        error: null,
        message: "there was an error while doing transaction ",
        errorData: null,
      };
      res.send(response_payload);
    }
  }
);

app.get(
  "/channels/:channelName/chaincodes/:chaincodeName/getbill",
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
            result: result,
            unitPrice: message1[0].value.unitPrice,
            ServiceCharges: message1[0].value.servicesCharges,
            tax: message1[0].value.tax,
            error: null,
            errorData: null,
            Ishistory: true,
          };
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

// const fs = require('fs');

// // Read the wallet ID file
// fs.readFile('/path/to/walletIDFile', (err, data) => {
//   if (err) {
//     // Handle the error
//   }

//   // Return the wallet ID file to the client
//   res.json({
//     success: true,
//     walletIDFile: data
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
