const models = require('../models')
const cryptoApi = require('./cryptoApi')
const fetch = require(`node-fetch`)
const { AbortError } = require(`node-fetch`)

let encriptionKeysArrayMap = new Map() //cache for payload encryption keys
let currentHits = 0;
let refreshMapHitsCount = 10 //at 100 hits map should be refreshed
let mapCacheTimeHours = 1 //termenul de valabilitate al unui item in encr_keys_map. in ore.
exports.decryptPayloadForKey = (mapKey, encryptedPayload) => {
    let keysArray = encriptionKeysArrayMap.get(mapKey)
    if (!keysArray)
        throw new Error(`no such key (${mapKey}) in encrpytion keys map`)
    for (const key of keysArray) {
        encryptedPayload = cryptoApi.decryptTextAes(encryptedPayload, key)
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
            try {
                let hoursDiff = Math.abs(Date.parse(key) - Date.now()) / 36e5;
                if (hoursDiff > mapCacheTimeHours)
                    encriptionKeysArrayMap.delete(key)
            } catch (error) {
                continue //in case there are other keys. ex: announce key
            }
        }
        currentHits = 0
    }
    let aesKeys = []
    for (let index = 0; index < hops.length + 1; index++) {
        aesKeys.push(cryptoApi.generateAesKey())
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
    let currentAesKey = cryptoApi.generateAesKey()
    let prevAesKeyObj = currentAesKey
    prevOnion = finalOnion
    let i

    for (i = allHops.length - 1; i > 0; i--) {
        const hop = allHops[i];
        currentOnion = new models.Onion()
        currentOnion.onionLayer = cryptoApi.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj)
        currentOnion.next.encryptedAesKey = cryptoApi.encrpytTextRsa(JSON.stringify(prevAesKeyObj), hop.publicKey)
        currentOnion.next.aesPublicKey = hop.publicKey
        currentOnion.next.ip = hop.ip
        currentOnion.next.port = hop.port
        portsOrder = [hop.port].concat(portsOrder)
        keysOrder = [hop.publicKey].concat(keysOrder)
        ip = hop.ip
        port = hop.port
        // currentOnion.message = 'fwd'
        currentOnion.encryptExternalPayload = aesKeys[allHops.length - i - 1] //aes keys in normal order
        prevOnion = JSON.parse(JSON.stringify(currentOnion))
        prevAesKeyObj = cryptoApi.generateAesKey()
    }


    return {
        onion: cryptoApi.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj),
        ecryptedAesKey: cryptoApi.encrpytTextRsa(JSON.stringify(prevAesKeyObj), allHops[i].publicKey),
        port: allHops[i].port,
        ip: allHops[i].ip,
        encryptExternalPayload: aesKeys[allHops.length - i - 1] //last aes key
    }
}

// -------------------------------------- TO -----------------------------------------------
exports.prepTransitCell = (hops, destip, destport, destPbKey, message, payload, returnData = null) => {
    //hop: [{ip, port, publicKey}, {same}]

    let finalOnion = new models.Onion()
    finalOnion.message = message // != false/undefined or null
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
    let currentAesKey = cryptoApi.generateAesKey()
    let prevAesKeyObj = currentAesKey

    prevOnion = finalOnion
    let i
    for (i = 0; i < allHops.length - 1; i++) {
        const hop = allHops[i];
        currentOnion = new models.Onion()
        currentOnion.onionLayer = cryptoApi.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj)
        currentOnion.next.encryptedAesKey = cryptoApi.encrpytTextRsa(JSON.stringify(prevAesKeyObj), hop.publicKey)
        currentOnion.next.aesPublicKey = hop.publicKey //dev
        currentOnion.next.ip = hop.ip
        currentOnion.next.port = hop.port
        portsOrder = [hop.port].concat(portsOrder)
        keysOrder = [hop.publicKey].concat(keysOrder)
        ip = hop.ip
        port = hop.port
        // currentOnion.message = 'fwd'
        currentOnion.encryptExternalPayload = undefined //nimic momentan
        prevOnion = JSON.parse(JSON.stringify(currentOnion))
        prevAesKeyObj = cryptoApi.generateAesKey()
    }

    let transitCell = new models.TransitCell()
    transitCell.externalPayload = payload
    transitCell.onion = cryptoApi.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj)
    transitCell.encryptedAesKey = cryptoApi.encrpytTextRsa(JSON.stringify(prevAesKeyObj), allHops[i].publicKey)
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

exports.sendOnion = async (ip, port, body, timeout = 5000) => {
    const controller = new AbortController();
    const tm = setTimeout(() => {
        controller.abort();
    }, timeout);
    return new Promise(async (resolve, reject) => {
        let url = this.buildUrl(ip, port)
        fetch(`${url}/relay`, {
            method: `POST`,
            body: JSON.stringify({
                ...body,
                requesterPort: global.config.port
            }),
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
        }).then(async req_res => {
            clearTimeout(tm)
            let responseEncriptedText = await req_res.text();
            let response
            if (responseEncriptedText != '') {
                try {
                    response = cryptoApi.decrpytTextRsa(responseEncriptedText)
                } catch (error) {
                    response = ''
                }
            }
            if (!req_res.ok) {
                if (response)
                    return reject(`sending onion to ${ip} : ${port} failed with error ${response}`)
                reject(`sending onion to ${ip} : ${port} failed with status code ${req_res.status}`)
            }
            resolve(response)
        }).catch(error => {
            //add error handling in case of connreset error
            if (error.type && error.type == 'aborted') {
                return reject('timeout');
            }
            reject(error);
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

