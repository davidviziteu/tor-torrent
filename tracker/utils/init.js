const fs = require('fs');
const crypto = require(`crypto`)
let configurations
try {
    let json = fs.readFileSync('./config.json', 'utf8');
    configurations = JSON.parse(json);
} catch (error) {
    console.err(error);
    console.log('loading default configs');
    configurations = {}
}
global.ip = configurations.ip ? configurations.ip : 'localhost'
global.port = configurations.port ? configurations.port : 6969
global.sessionDurationMinutes = configurations.sessionDurationMinutes ? configurations.sessionDurationMinutes * 60000 : 30 * 60000
global.maxRelayNodesReturned = configurations.maxRelayNodesReturned ? configurations.maxRelayNodesReturned : 30
global.maxLeechersReturned = configurations.maxLeechersReturned ? configurations.maxLeechersReturned : 30
global.dev = configurations.dev ? configurations.dev : false

function refreshAll() {
    try {
        const { publicKey, privateKey } = crypto.generateKeyPairSync(`rsa`, {
            modulusLength: configurations.modulusLength ? configurations.modulusLength : 2048,
        })
        global.publicKey = publicKey
        global.privateKey = privateKey
        global.publicKeyString = publicKey.export({
            format: `pem`,
            type: `spki`
        })
        global.relaysMap = {}
        global.leechersMap = new Map()
        console.log('ok refresh');
        global.lastSessionRefresh = Date.now()
    } catch (error) {
        console.log(error);
        console.log('error when generating keys and session id, exiting..');
        process.exit(1);
    }
}

refreshAll()
setInterval(refreshAll, sessionDurationMinutes);
console.log('ok init');
console.log(`session duration is ${sessionDurationMinutes / 60000} minutes`);