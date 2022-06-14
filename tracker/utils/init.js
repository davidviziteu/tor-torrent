const fs = require('fs');
const crypto = require(`crypto`)

let json = fs.readFileSync('./config.json', 'utf8');
configurations = JSON.parse(json);
global.ip = configurations.ip ? configurations.ip : 'localhost'
global.port = configurations.port ? configurations.port : 6969
global.sessionDurationMinutes = configurations.sessionDurationMinutes ? configurations.sessionDurationMinutes * 60000 : 30 * 60000
function generatePbKeyAndSessionId() {
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
        global.sessionId = crypto.randomBytes(16).toString(`hex`)
        global.nodesMap = new Map()
        global.nodesArray = new Array()
        console.log('ok refresh');
        global.lastSessionRefresh = Date.now()
    } catch (error) {
        console.log(error);
        console.log('error when generating keys and session id, exiting..');
        process.exit(1);
    }
}

generatePbKeyAndSessionId()
setTimeout(generatePbKeyAndSessionId, sessionDurationMinutes);
console.log('ok init');