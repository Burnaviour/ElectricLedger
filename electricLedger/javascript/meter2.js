const invoke = require("./invoke");
const grid = require("./grid");
// Initialize the units to 0
// read file and make object
const log4js = require('log4js');

// configure logger
log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } }
});
// Set the update interval to 2 minutes (120000 milliseconds)
const updateInterval = 5000;
const logger = log4js.getLogger();
// Run the update loop
setInterval(async function () {
  // Increase the units by a random amount
  let units = 0;
  units += Math.floor(Math.random() * 100);
  if (grid.consumeUnits(units, "uid0")) {

    var message = await invoke.invokeMeterUnits(
      "mycahnnel",
      "electricledger",
      "writeData",
      ["moiz", "malir cent", units, "35201-35203"],
      "appUser",
      "Org1",
      "uid1"
    );
    // Log the updated units
    logger.info(`Units Consumed Today: ${message}`);
  } else { logger.info("Grid is under development cannot update units") }




}, updateInterval);
