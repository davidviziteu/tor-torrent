const fetch = require('node-fetch');
const { encrpytTextAes, generateAesKey, encrpytTextRsa, decryptTextAes } = require('./cryptoApi')
const utils = require('./utils')
const comm = require('./comm')
//done
exports.fetchHops = async () => {
    if (!trackerAddress) {
        global.trackerError = 'Tracker address is not known'
        console.log(`trackerAddress is not defined`)
    }
    try {
        let aesKey = generateAesKey()
        const r = await fetch(global.trackerAddress + `/scrape/relay`,
            {
                headers: { "Content-Type": "application/json" },
                method: `POST`,
                body: JSON.stringify({
                    encryptedKey: encrpytTextRsa(JSON.stringify(aesKey), global.trackerPbKey),
                })
            })
        const response = await (r).json()

        if (!response.encryptedData || response.error) {
            console.log(`error tracker didnt return relay list`);
            console.log(`\terror: ${response.error}`);
            global.trackerError = `Tracker did not return relay list. Click to retry.`
            global.progressLoaded = false
        }
        global.trackerError = undefined
        return JSON.parse(decryptTextAes(response.encryptedData, aesKey))
    } catch (error) {
        global.trackerError = 'Tracker did not return relay list. Click to retry.'
        global.progressLoaded = false
        console.log(error)
        console.log(`error at fetching relay list from tracker`);
    }
}

//done
exports.announceAsNode = async () => {
    if (!trackerAddress) {
        global.trackerError = 'tracker address is not known'
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
        let decryptedData = decryptTextAes(response.encryptedData, key)
        let _decrData = JSON.parse(decryptedData)
        global.myIp = _decrData.publicIp
        global.ip = _decrData.publicIp
        global.config.ip = _decrData.publicIp
        global.relayNode = true
        console.log(`announce as node ok`);
        global.trackerError = undefined
    } catch (error) {
        global.trackerError = 'tracker seems to be unreachable, retrying...'
        console.error(error)
        console.log(`error at announce`);
    }
}

//infohashes is an array of strings
exports.announceLeeching = async (infoHashes) => {
    if (!trackerAddress) {
        global.trackerError = 'tracker address is not known'
        console.log(`trackerAddress is not defined`)
    }

    let dataToEncrypt = []

    let hops = await this.fetchHops()

    for (let i = 0; i < infoHashes.length; i++) {
        let infoHash = infoHashes[i]
        let announceObject = {
            infoHash: infoHash,
            replyOnions: []
        }
        for (let i = 0; i < global.announcesPerTorrent; i++) {
            let hopsArr = []
            for (let index = 0; index < global.circuitLength; index++) {
                let random = utils.getRandomInteger(0, hops.length - 1)
                hopsArr.push(hops[random])
            }

            let replyOnion = comm.prepReplyOnion(hopsArr, infoHash, 'upload')
            announceObject.replyOnions.push(replyOnion)
        }
        dataToEncrypt.push(announceObject)
    }

    try {
        const key = generateAesKey()
        let dataToSend = encrpytTextAes(dataToEncrypt, key)
        const response = await (await fetch(trackerAddress + `/announce`,
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
            console.log(`announcing leecing, tracker error`);
            return undefined
        }
        reponse = JSON.parse(decryptTextAes(response.encryptedData, key))
        if (reponse.error) {
            console.log(`announcing leecing, tracker error`);
            return undefined
        }
        global.trackerError = undefined
        return
    } catch (error) {
        global.trackerError = 'tracker seems to be unreachable, retrying...'
        console.error(error)
        console.log(`\t ^ error at announce as leecher`);
    }

}

exports.getLeechers = async (infoHashes) => {
    if (!trackerAddress) {
        global.trackerError = 'tracker address is not known'
        console.log(`trackerAddress is not defined`)
    }

    try {
        const key = generateAesKey()
        let dataToSend = encrpytTextAes(JSON.stringify(infoHashes), key)
        let response = await (await fetch(trackerAddress + `/scrape`,
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
            console.log(`scraping leechers, tracker data validation error`);
            return undefined
        }
        reponse = JSON.parse(decryptTextAes(response.encryptedData, key))
        if (reponse.error) {
            console.log(error);
            console.log(`scraping leechers, tracker error`);
            return undefined
        }
        global.trackerError = undefined
        // return response
        let filteredResponse = {}
        //filter my Reply onions
        for (const [key, value] of Object.entries(reponse)) {
            let hash = key
            filteredResponse[hash] = []
            let hashLeechersArr = value
            for (let i = 0; i < hashLeechersArr.length; i++) {
                //check if leecher.encryptExternalPayload is in global.myReplyOnionsKeys
                let found = false
                for (let index = 0; index < global.myReplyOnionsKeys.length; index++) {
                    const myKey = global.myReplyOnionsKeys[index]
                    if (JSON.stringify(hashLeechersArr[i].encryptExternalPayload) === myKey) {
                        found = true
                        break
                    }
                }
                if (found)
                    continue //dont add
                filteredResponse[hash].push(hashLeechersArr[i])
            }
        }

        return filteredResponse
    } catch (error) {
        global.trackerError = 'tracker seems to be unreachable, retrying...'
        console.error(error)
        console.log(`\t ^ error at announce as leecher`);
    }
}


//done
exports.getTrackerPublicKey = async () => {
    if (!trackerAddress) {
        global.trackerError = 'tracker address is not known'
        console.log(`trackerAddress is not defined`)
    }
    try {
        const response = await (await fetch(global.trackerAddress + `/public-key`)).json()
        global.trackerPbKey = response.publicKey
        global.trackerError = undefined
        return response.publicKey
    } catch (error) {
        global.trackerError = 'tracker seems to be unreachable, retrying...'
        console.error(error)
        console.log(`error at fetching public key from tracker`);
    }
}
