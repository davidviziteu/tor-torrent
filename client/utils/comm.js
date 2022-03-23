const models = require('../models')
const utils = require('./index')
const fetch = require(`node-fetch`)

let encr_keys_map = new Map()

exports.decryptPayloadForKey = (mapKey, encryptedPayload) => {
    let keysArray = encr_keys_map.get(mapKey)
    if (!keysArray)
        throw new Error(`no such key (${mapKey}) in encrpytion keys map`)
    for (const key of keysArray) {
        encryptedPayload = utils.decryptTextAes(encryptedPayload, key)
    }
    return encryptedPayload
}
/**
 * the hops are being iterated in reverse order.
 * @param {*} hops array of {ip, port, publicKey} that represents the 
 * @returns an ecrypted return onion that contains aes keys to encrypt a cell's external payload
 */
exports.prepReturnOnion = hops => {
    //build array of aes keys to be stored
    //hop: 

    //CLEAR MAP KEYS
    let now = new Date()
    let aesKeys = []
    for (let index = 0; index < hops.length + 1; index++) {
        aesKeys.push(utils.generateAesKey())
    }
    // let hoursDiff = Math.abs(Date.parse(lastTimeComputed) - Date.now()) / 36e5;
    let mapKey = `${now.getMinutes()}:${now.getSeconds()}:${now.getMilliseconds()}` //asta nu e bun, scrie in cod o ciudatenie
    encr_keys_map.set(mapKey, aesKeys)


    let finalOnion = new models.Onion()
    finalOnion.message = `key ${mapKey}`
    finalOnion.next.ip = undefined
    finalOnion.next.port = undefined
    finalOnion.next.encryptedAesKey = undefined
    finalOnion.onionLayer = undefined

    let allHops = hops.concat([{
        ip: config.ip,
        port: config.port,
        publicKey: publicKeyString //debug
    }])

    let portsOrder = []
    let keysOrder = []

    let currentOnion = new models.Onion()
    let currentAesKey = utils.generateAesKey()
    let prevAesKeyObj = currentAesKey
    prevOnion = finalOnion
    let i

    for (i = allHops.length - 1; i > 0; i--) {
        const hop = allHops[i];
        currentOnion = new models.Onion()
        currentOnion.onionLayer = utils.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj)
        currentOnion.next.encryptedAesKey = utils.encrpytTextRsa(JSON.stringify(prevAesKeyObj), hop.publicKey)
        currentOnion.next.aesPublicKey = hop.publicKey
        currentOnion.next.ip = hop.ip
        currentOnion.next.port = hop.port
        portsOrder = [hop.port].concat(portsOrder)
        keysOrder = [hop.publicKey].concat(keysOrder)
        ip = hop.ip
        port = hop.port
        currentOnion.message = 'fwd'
        currentOnion.encryptExternalPayload = aesKeys[allHops.length - i - 1] //aes keys in normal order
        prevOnion = JSON.parse(JSON.stringify(currentOnion))
        prevAesKeyObj = utils.generateAesKey()
    }


    return {
        onion: utils.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj),
        ecryptedAesKey: utils.encrpytTextRsa(JSON.stringify(prevAesKeyObj), allHops[i].publicKey),
        port: allHops[i].port,
        ip: allHops[i].ip,
        encryptExternalPayload: aesKeys[allHops.length - i - 1] //last aes key
    }
}

// -------------------------------------- TO -----------------------------------------------
exports.prepTransitCell = (hops, destip, destport, destPbKey, message, payload, returnData = null) => {
    //hop: [{ip, port, publicKey}, {same}]

    let finalOnion = new models.Onion()
    finalOnion.message = message // != fwd
    if (returnData) {
        finalOnion.next.ip = returnData.ip
        finalOnion.next.port = returnData.port
        finalOnion.next.encryptedAesKey = returnData.ecryptedAesKey
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
    let currentAesKey = utils.generateAesKey()
    let prevAesKeyObj = currentAesKey

    prevOnion = finalOnion
    let i
    for (i = 0; i < allHops.length - 1; i++) {
        const hop = allHops[i];
        currentOnion = new models.Onion()
        currentOnion.onionLayer = utils.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj)
        currentOnion.next.encryptedAesKey = utils.encrpytTextRsa(JSON.stringify(prevAesKeyObj), hop.publicKey)
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
        prevAesKeyObj = utils.generateAesKey()
    }

    let transitCell = new models.TransitCell()
    transitCell.externalPayload = payload
    transitCell.onion = utils.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj)
    transitCell.encryptedAesKey = utils.encrpytTextRsa(JSON.stringify(prevAesKeyObj), allHops[i].publicKey)
    transitCell.aesPublicKey = allHops[i].publicKey
    keysOrder = [allHops[i].publicKey].concat(keysOrder)
    portsOrder = [allHops[i].port].concat(portsOrder) //for debugging
    console.log(portsOrder);
    return { transitCell: transitCell, nextIp: allHops[i].ip, nextPort: allHops[i].port }
}

exports.buildUrl = (ip, port) => {
    if (ip.indexOf(':') >= 0)
        return `http://[${ip}]:${port}`
    return `http://${ip}:${port}`
}

exports.sendOnion = async (ip, port, body) => {
    return new Promise((resolve, reject) => {
        let url = this.buildUrl(ip, port)
        fetch(`${url}/route`, {
            method: `POST`,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        }).then(req_res => {
            if (req_res.ok)
                resolve(req_res.status)
            reject(` sending onion to ${ip} : ${port} failed with status code ${req_res.status}`)
        })
    })

}



