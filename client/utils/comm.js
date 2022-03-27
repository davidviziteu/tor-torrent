const models = require('../models')
const utils = require('./index')
const fetch = require(`node-fetch`)

let encriptionKeysArrayMap = new Map() //cache for payload encryption keys
let currentHits = 0;
let refreshMapHitsCount = 1 //at 100 hits map should be refreshed
let mapCacheTimeHours = 1 //termenul de valabilitate al unui item in encr_keys_map. in ore.
exports.decryptPayloadForKey = (mapKey, encryptedPayload) => {
    let keysArray = encriptionKeysArrayMap.get(mapKey)
    if (!keysArray)
        throw new Error(`no such key (${mapKey}) in encrpytion keys map`)
    for (const key of keysArray) {
        encryptedPayload = utils.decryptTextAes(encryptedPayload, key)
    }
    encriptionKeysArrayMap.delete(mapKey)
    return encryptedPayload
}
/**
 * adds in the encriptionKeysArrayMap a key - time when computed and a value - array of AES keys
 *                                          that the response payload should be encrypted with)
 * refreshes the map cache every 100 insertions: deletes the values that were computed more than 
 *                                                                      {mapCacheTimeHours} hours
 * the hops are being iterated in reverse order. 
 * the aes keys array are generated and iterated in the same order
 * @param {*} hops array of {ip, port, publicKey} that represents the path of a transit cell in the network
 * @returns an ecrypted return onion that contains aes keys to encrypt a cell's external payload
 */
exports.prepReturnOnion = hops => {
    currentHits++
    if (currentHits == refreshMapHitsCount) {
        let mapKeys = [...encriptionKeysArrayMap.keys()]
        for (const key in mapKeys) {
            let hoursDiff = Math.abs(Date.parse(key) - Date.now()) / 36e5;
            if (hoursDiff > mapCacheTimeHours)
                encriptionKeysArrayMap.delete(key)
        }
        currentHits = 0
    }
    let aesKeys = []
    for (let index = 0; index < hops.length + 1; index++) {
        aesKeys.push(utils.generateAesKey())
    }
    let mapKey = `${Date.now()}`
    encriptionKeysArrayMap.set(mapKey, aesKeys)


    let finalOnion = new models.Onion()
    finalOnion.message = `key ${mapKey}`
    finalOnion.next.ip = undefined
    finalOnion.next.port = undefined
    finalOnion.next.encryptedAesKey = undefined
    finalOnion.onionLayer = undefined

    let allHops = hops.concat([{
        ip: config.ip,
        port: config.port,
        publicKey: publicKeyString
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
    return new Promise(async (resolve, reject) => {
        let url = this.buildUrl(ip, port)
        fetch(`${url}/route`, {
            method: `POST`,
            body: JSON.stringify({
                ...body,
                requesterPort: global.config.port
            }),
            headers: { 'Content-Type': 'application/json' }
        }).then(async req_res => {
            let responseEncriptedText = await req_res.text();
            let response
            if (responseEncriptedText != '') {
                try {
                    response = utils.decrpytTextRsa(responseEncriptedText)
                } catch (error) {
                    response = ''
                }
            }
            if (!req_res.ok) {
                if (response)
                    reject(`sending onion to ${ip} : ${port} failed with error ${response}`)
                reject(`sending onion to ${ip} : ${port} failed with status code ${req_res.status}`)
            }
            resolve(response)
        })
    })

}

exports.getPublicKey = async (ip, port) => {
    return new Promise((resolve, reject) => {
        let url = this.buildUrl(ip, port)
        fetch(`${url}/publicKey`).then(async req_res => {
            if (req_res.ok) {
                let pbJson = await req_res.json()
                resolve(pbJson.publicKey)
            }
            reject(`getting public key from ${ip} : ${port} failed with status code ${req_res.status}`)
        })
    })
}

