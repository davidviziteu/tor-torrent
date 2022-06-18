
const fs = require('fs');
let config = {}
console.log(`\n\n`);
try {
    config = JSON.parse(process.argv[2].replaceAll(`'`, `"`))
} catch {
    config.ip = `localhost`
    config.port = 10000
}

global.config = config
global.port = config.port
configurations = {
    "announcesPerTorrent": config.announces ? config.announces : 3,
    "circuitLength": config.circuitLen ? config.circuitLen : 3,
    "maxPiecesPerMessage": config.maxPieces ? config.maxPieces : 3,
    "dev": true
}
global.keysError = null
global.refreshLoopStarted = false
global.storagePath = config.path ? `${config.path}/data${global.port}.json` : `./data${global.port}.json`
global.iannouncesPerTorrentp = configurations.announcesPerTorrent ? configurations.announcesPerTorrent : 3
global.circuitLength = configurations.circuitLength ? configurations.circuitLength : 3
global.maxPiecesPerMessage = configurations.maxPiecesPerMessage ? configurations.maxPiecesPerMessage : 10
global.dev = configurations.dev ? configurations.dev : false
global.trackerAddress = configurations.dev ? `http://localhost:6969` : undefined
global.trackerPbKey = undefined
const AppManager = require('./appDataManager');
const AppStatsManager = require('./appStatsManager');
AppManager.loadProgress()
AppStatsManager.setOnionLayers(configurations.circuitLength)
AppStatsManager.setFakeAnnounces(configurations.announcesPerTorrent)
AppStatsManager.setMaxPiecesPerMessage(configurations.maxPiecesPerMessage)

console.log('ok init');




