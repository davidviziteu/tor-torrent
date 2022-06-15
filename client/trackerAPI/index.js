const fetch = require('node-fetch');
const { encrpytTextAes, generateAesKey, encrpytTextRsa, decryptTextAes } = require('../utils')

exports.fetchHops = async (count, destip, destport) => {
    count += 2 // to avoid the me and destination node in the hops list. tracker already does not return a node with the sender's ip addr
    return new Promise((resolve, reject) => {
        console.log(`promise`);
        fetch(`http://localhost:6969/scrape/nodes/${count}`).then(res => {
            console.log(`fetched from tracker`);
            if (!res.ok)
                reject(`fetching ${count} hops failed. tracker status code: ${res.status}`)
            res.json().then(_json => {
                _json = _json.nodes
                let foundIndex = _json.findIndex(itm => itm.ip == destip && itm.port == destport)
                if (foundIndex >= 0)
                    _json.splice(foundIndex, 1)
                else
                    _json.pop()
                if (!global.myIp) {
                    console.log('[WARNING] announce was not succesful. global.myIp is not defined')
                    resolve(_json)
                }
                foundIndex = _json.findIndex(itm => itm.ip == global.myIp && itm.port == global.config.port)
                if (foundIndex >= 0)
                    _json.splice(foundIndex, 1)
                else
                    _json.pop()
                resolve(_json)
            }) //TODO filter the destination node from the hops list provided by the tracker
        }, error => {
            reject(`fetching ${count} hops failed. tracker status code: ${error}`)
        })
    })
}



// exports.fetchHops = async (count, destip, destport) => {
//     count++ // to avoid the destination node in the hops list. tracker already does not return a node with the sender's ip addr
//     console.log(`promise build`);
//     let res = await fetch(`http://localhost:6969/scrape/nodes/${count}`)
//     console.log(`fetched from tracker`);
//     if (!res.ok)
//         throw `fetching ${count} hops failed. tracker status code: ${res.status}`
//     let _json = await res.json()
//     //TODO filter the destination node from the hops list provided by the tracker
//     _json = _json.nodes
//     const foundIndex = _json.findIndex(itm => itm.ip == destip && itm.port == destport)
//     if (foundIndex >= 0)
//         _json.splice(foundIndex, 1)
//     else
//         _json.pop()
//     return _json
// }


exports.getPublicKeyOfNode = async (destip, destport) => {
    return new Promise((resolve, reject) => {
        fetch(`http://localhost:6969/public-key/${destip}/${destport}`).then(res => {
            if (res.status != 200)
                return reject(`fetch public key of destination node ${destip}:${destport} ` +
                    `failed. tracker status code: ${res.status}`)
            return res.json().then(_json => resolve(_json.publicKey))
        })
    })
}


exports.announceAsNode = async () => {
    if (!trackerAddress) {
        console.log(`tracker address is not defined`);
    }

    try {
        let dataToEncrypt = {
            port: config.port,
            publicKey: global.publicKeyString,
        }
        const key = generateAesKey()
        let dataToSend = encrpytTextAes(dataToEncrypt, key)
        const response = await (await fetch(trackerAddress + `/announce/relay`,
            {
                headers: {
                    "Content-Type": "application/json"
                },
                method: `POST`,
                body: JSON.stringify({
                    encryptedKey: encrpytTextRsa(key, global.trackerPbKey),
                    encryptedData: dataToSend
                })
            })).json()
        if (!response.encryptedData) {
            console.log(`announce as node failed, tracker error`);
            return undefined
        }
        reponse = JSON.parse(decryptTextAes(response.encryptedData, key))
        global.myIp = response.publicIp
        global.relayNode = true
        console.log(`announce as node ok`);
    } catch (error) {
        console.error(error)
        console.log(`error at announce`);
    }
}



//TODO
exports.announcePiece = async (data) => {
    //check
    try {
        const response = await fetch(`http://localhost:6969/announce/piece`,
            {
                headers: {
                    "Content-Type": "application/json"
                },
                method: `POST`,
                body: data
            })
        if (response.status != 200) {
            console.log(await response.text());
            return undefined
        }
        return 'ok'
    } catch (error) {
        console.error(error)
        console.log(`error at announce piece`);
        return error
    }
}



exports.getTrackerPublicKey = async () => {
    if (!trackerAddress) {
        console.log(`trackerAddress is not defined`)
        process.exit(1)
    }
    try {
        const response = await (await fetch(global.trackerAddress + `/public-key`)).json()
        global.trackerPbKey = response.publicKey
        return response.publicKey
    } catch (error) {
        console.error(error)
        console.log(`error at fetching public key from tracker, setting it to undefined..`);
        global.trackerPbKey = undefined
        return undefined
    }
}
