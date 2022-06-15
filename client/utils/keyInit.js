const crypto = require(`crypto`)
const fs = require('fs')

let config = {}
console.log(`\n\n\n\n\n\n`);
try {
    config = JSON.parse(process.argv[2].replaceAll(`'`, `"`))
} catch {
    config.ip = `localhost`
    config.port = 10000
}

global.config = config

try {
    let json = fs.readFileSync('./config.json', 'utf8');
    configurations = JSON.parse(json);
} catch (error) {
    console.err(error);
    console.log('loading default configs');
    configurations = {}
}
global.iannouncesPerTorrentp = configurations.announcesPerTorrent ? configurations.announcesPerTorrent : 3
global.circuitLength = configurations.circuitLength ? configurations.circuitLength : 3
global.maxPiecesPerMessage = configurations.maxPiecesPerMessage ? configurations.maxPiecesPerMessage : 10
global.dev = configurations.dev ? configurations.dev : false
global.trackerAddress = configurations.dev ? `http://localhost:6969` : undefined
global.trackerPbKey = undefined

console.log('ok init');





