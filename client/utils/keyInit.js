let config = {}
console.log(`\n\n\n\n\n\n`);
try {
    config = JSON.parse(process.argv[2].replaceAll(`'`, `"`))
} catch {
    config.ip = `localhost`
    config.port = 10000
}

global.config = config

configurations = {
    "announcesPerTorrent": 3,
    "circuitLength": 3,
    "maxPiecesPerMessage": 10,
    "dev": true
}

global.iannouncesPerTorrentp = configurations.announcesPerTorrent ? configurations.announcesPerTorrent : 3
global.circuitLength = configurations.circuitLength ? configurations.circuitLength : 3
global.maxPiecesPerMessage = configurations.maxPiecesPerMessage ? configurations.maxPiecesPerMessage : 10
global.dev = configurations.dev ? configurations.dev : false
global.trackerAddress = configurations.dev ? `http://localhost:6969` : undefined
global.trackerPbKey = undefined

console.log('ok init');





