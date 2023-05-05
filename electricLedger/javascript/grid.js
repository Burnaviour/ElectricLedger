const fs = require('fs');
// read file and make object

const INTERVAL = 2000;
function logUnits() {

    let content = JSON.parse(fs.readFileSync('./grid.json', 'utf8'));
    // edit or add property
    let units = content.units;
    if (units > 0) { console.log(`Total Grid Units available ${units}`); }
    else console.log("Grids is Down for Mantaincace");
}

// Call logUnits() every INTERVAL milliseconds
setInterval(logUnits, INTERVAL);
//write file
// fs.writeFileSync('./config/idgen.json', JSON.stringify(content));
