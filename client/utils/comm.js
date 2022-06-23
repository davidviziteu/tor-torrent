const models = require('../models')
const cryptoApi = require('./cryptoApi')
const fetch = require(`node-fetch`)
const { eventEmitter, trackerRefreshSessionEv } = require('./eventsManager')

let encriptionKeysArrayMap = new Map() //cache for payload encryption keys
eventEmitter.on(trackerRefreshSessionEv, () => {
    encriptionKeysArrayMap = new Map()
})
exports.decryptPayloadForKey = (mapKey, encryptedPayload) => {
    let keysArray = encriptionKeysArrayMap.get(mapKey)
    if (!keysArray)
        throw new Error(`no such key (${mapKey}) in encrpytion keys map`)
    for (const key of keysArray) {
        encryptedPayload = cryptoApi.decryptTextAes(encryptedPayload, key)
    }
    return encryptedPayload
}


exports.prepReplyOnion = (hops, infoHash, type, rememberFirstROKey = true) => {

    let aesKeys = []
    for (let index = 0; index < hops.length + 1; index++) {
        aesKeys.push(cryptoApi.generateAesKey())
    }
    let mapKey = `${Date.now()}`
    encriptionKeysArrayMap.set(mapKey, aesKeys)


    let finalOnion = new models.Onion()
    finalOnion.message = {
        key: mapKey,
        infoHash: infoHash,
        type: type
    }
    finalOnion.next.ip = undefined
    finalOnion.next.port = undefined
    finalOnion.next.encryptedAesKey = undefined
    finalOnion.onionLayer = undefined

    let allHops = hops.concat([{
        ip: global.ip,
        port: config.port,
        publicKey: global.publicKeyString
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

    if (rememberFirstROKey)
        global.myReplyOnionsKeys.push(JSON.stringify(aesKeys[allHops.length - i - 1]))

    return {
        onion: cryptoApi.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj),
        encryptedAesKey: cryptoApi.encrpytTextRsa(JSON.stringify(prevAesKeyObj), allHops[i].publicKey),
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
        finalOnion.next.encryptedAesKey = returnData.encryptedAesKey
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

