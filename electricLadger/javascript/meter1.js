const invoke = require("./invoke");
// Initialize the units to 0
let units = 0;

// Set the update interval to 2 minutes (120000 milliseconds)
const updateInterval = 2000;

// Run the update loop
setInterval(async function () {
  // Increase the units by a random amount
  units += Math.floor(Math.random() * 10);
  let message = await invoke.invokeUnitsPrices(
    channelName,
    chaincodeName,
    "writeData",
    [unitsPrice, tax, Service],
    req.username,
    "Org1"
  );

  // Log the updated units
  console.log(`Updated units: ${units}`);
}, updateInterval);
