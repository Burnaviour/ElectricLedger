const fs = require('fs');
// read file and make object
let content = JSON.parse(fs.readFileSync('./config/idgen.json', 'utf8'));
// edit or add property
content.id =7;
//write file
fs.writeFileSync('./config/idgen.json', JSON.stringify(content));