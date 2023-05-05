const fs = require('fs');
// read file and make object
const log4js = require('log4js');

// configure logger
log4js.configure({
    appenders: { console: { type: 'console' } },
    categories: { default: { appenders: ['console'], level: 'info' } }
});
const INTERVAL = 7000;
// get logger
const logger = log4js.getLogger();
// log message when the script starts
logger.info('Grid script started up and running.');

function logUnits() {

    let content = JSON.parse(fs.readFileSync('./grid.json', 'utf8'));
    // edit or add property
    let units = content.units;
    if (units > 0) {
        logger.info(
            `Total Grid Units available ${units}`
        );
    }
    else logger.warn("Grids is Down for Mantaincace");
}


setInterval(logUnits, INTERVAL);




//write file
// fs.writeFileSync('./config/idgen.json', JSON.stringify(content));
