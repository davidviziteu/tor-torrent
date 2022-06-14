const crypto = require(`crypto`)

let config = {}
console.log(`\n\n\n\n\n\n`);
try {
    config = JSON.parse(process.argv[2].replaceAll(`'`, `"`))
} catch {
    config.ip = `localhost`
    config.port = 100
}
const modulusLength = 1024 * 2
const { publicKey, privateKey } = crypto.generateKeyPairSync(`rsa`, {
    modulusLength: modulusLength,
})

const { publicKeyPayload, privateKeyPayload } = crypto.generateKeyPairSync(`rsa`, {
    modulusLength: modulusLength,
})

global.publicKey = publicKey
global.privateKey = privateKey
global.privateKeyString = privateKey.export({
    format: `pem`,
    type: `pkcs1`
})
global.publicKeyString = publicKey.export({
    format: `pem`,
    type: `spki`
})
global.publicKeyPayloadString = publicKey.export({
    format: `pem`,
    type: `spki`
})
global.privateKeyPayload = privateKeyPayload

global.config = config

