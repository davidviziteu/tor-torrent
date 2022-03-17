const models = require('../models')
const encr = require('./index')
let encr_keys_map = new Map()

exports.prepReturnOnion = hops => {
    //build array of aes keys to be stored
    //hop: [{ip, port, publicKey}, {same}]

    //CLEAR MAP KEYS
    let now = new Date()
    let aesKyes = []
    for (let index = 0; index < hops.length; index++) {
        aesKyes.push(encr.generateAesKey())
    }
    let hoursDiff = Math.abs(Date.parse(lastTimeComputed) - Date.now()) / 36e5;
    let mapKey = `${now.getMinutes()}:${now.getSeconds}:${now.getMilliseconds()}`
    encr_keys_map.set(mapKey, aesKyes)


    let finalOnion = new models.Onion()
    finalOnion.message = mapKey
    finalOnion.next.ip = undefined
    finalOnion.next.port = undefined
    finalOnion.next.encryptedAesKey = undefined
    finalOnion.onionLayer = undefined

    let allHops = [{
        ip: config.ip,
        port: config.port,
        publicKey: publicKeyString
    }].concat(hops)

    let portsOrder = []
    let keysOrder = []

    let currentOnion = new models.Onion()
    let currentAesKey = encr.generateAesKey()
    let prevAesKeyObj = currentAesKey
    // currentOnion.onionLayer = 
    prevOnion = finalOnion
    let i
    for (i = 0; i < allHops.length - 1; i++) {
        const hop = allHops[i];
        currentOnion = new models.Onion()
        currentOnion.onionLayer = encr.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj)
        currentOnion.next.encryptedAesKey = encr.encrpytTextRsa(JSON.stringify(prevAesKeyObj), hop.publicKey)
        currentOnion.next.aesPublicKey = hop.publicKey
        currentOnion.next.ip = hop.ip
        currentOnion.next.port = hop.port
        portsOrder = [hop.port].concat(portsOrder)
        keysOrder = [hop.publicKey].concat(keysOrder)
        ip = hop.ip
        port = hop.port
        currentOnion.message = 'fwd'
        currentOnion.encryptExternalPayload = aesKyes[allHops.length - i - 1] //aes keys in reversed order
        prevOnion = JSON.parse(JSON.stringify(currentOnion))
        prevAesKeyObj = encr.generateAesKey()
    }
    return {
        onion: prevOnion,
        port: hops[i].port,
        ip: hops[i].ip,
        encryptExternalPayload: aesKyes[allHops.length - i - 1] //first aes key
    }
}

// -------------------------------------- TO -----------------------------------------------
exports.prepTransitCell = (hops, destip, destport, destPbKey, message, payload, returnData = null) => {
    //hop: [{ip, port, publicKey}, {same}]

    let finalOnion = new models.Onion()
    finalOnion.message = message // != fwd
    if (returnData) {
        finalOnion.next.ip = returnData.ip
        finalOnion.next.port = returnData.ip
        finalOnion.next.encryptedAesKey = undefined
        finalOnion.onionLayer = returnData.onion
        finalOnion.encryptExternalPayload = returnData.encryptExternalPayload
    }

    let allHops = [{
        ip: destip,
        port: destport,
        publicKey: destPbKey
    }].concat(hops)

    let portsOrder = []
    let keysOrder = []

    let currentOnion = new models.Onion()
    let currentAesKey = encr.generateAesKey()
    let prevAesKeyObj = currentAesKey

    prevOnion = finalOnion
    let i
    for (i = 0; i < allHops.length - 1; i++) {
        const hop = allHops[i];
        currentOnion = new models.Onion()
        currentOnion.onionLayer = encr.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj)
        currentOnion.next.encryptedAesKey = encr.encrpytTextRsa(JSON.stringify(prevAesKeyObj), hop.publicKey)
        currentOnion.next.aesPublicKey = hop.publicKey //dev
        currentOnion.next.ip = hop.ip
        currentOnion.next.port = hop.port
        portsOrder = [hop.port].concat(portsOrder)
        keysOrder = [hop.publicKey].concat(keysOrder)
        ip = hop.ip
        port = hop.port
        currentOnion.message = 'fwd'
        currentOnion.encryptExternalPayload = undefined //nimic momentan
        prevOnion = JSON.parse(JSON.stringify(currentOnion))
        prevAesKeyObj = encr.generateAesKey()
    }

    let transitCell = new models.TransitCell()
    transitCell.externalPayload = payload
    transitCell.onion = encr.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj)
    transitCell.encryptedAesKey = encr.encrpytTextRsa(JSON.stringify(prevAesKeyObj), allHops[i].publicKey)
    transitCell.aesPublicKey = allHops[i].publicKey
    keysOrder = [allHops[i].publicKey].concat(keysOrder)
    portsOrder = [allHops[i].port].concat(portsOrder) //for debugging
    console.log(portsOrder);
    return { transitCell: transitCell, nextIp: allHops[i].ip, nextPort: allHops[i].port }
}

