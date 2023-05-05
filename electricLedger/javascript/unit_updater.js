
const fs = require('fs');
const log4js = require('log4js');

// configure logger
log4js.configure({
    appenders: { console: { type: 'console' } },
    categories: { default: { appenders: ['console'], level: 'info' } }
});

const logger = log4js.getLogger();
function consumeUnits(consumedUnits, userName) {
    let content = JSON.parse(fs.readFileSync('./grid.json', 'utf8'));
    let units = content.units;
    if (units >= consumedUnits) {
        units -= consumedUnits;
        content.units = units;
        fs.writeFileSync('./grid.json', JSON.stringify(content));
        logger.info(`user with ${userName} has consumed ${consumedUnits} units.`);
        return true;
    } else {
        console.log(`Not enough units available for ${userName}.`);
        return false;
    }
}
module.exports = {
    consumeUnits: consumeUnits,
};