const fetch = require('node-fetch');
const { encrpytTextAes, generateAesKey, encrpytTextRsa, decryptTextAes } = require('./cryptoApi')

//done
exports.fetchHops = async () => {
    if (!trackerAddress) {
        global.trackerError = 'tracker address is not known'
        console.log(`trackerAddress is not defined`)
    }
    try {
        aesKey = generateAesKey()
        const r = await fetch(global.trackerAddress + `/scrape/relay`,
            {
                headers: { "Content-Type": "application/json" },
                method: `POST`,
                body: JSON.stringify({
                    encryptedKey: encrpytTextRsa(aesKey, global.trackerPbKey),
                })
            })
        const response = await (r).json()

        if (!response.encryptedData || response.error) {
            console.log(`error tracker didnt return relay list`);
            console.log(`\terror: ${response.error}`);
            throw `error tracker didnt return relay list`
        }
        global.trackerError = undefined
        return JSON.parse(decryptTextAes(response.encryptedData, aesKey))
    } catch (error) {
        global.trackerError = 'tracker seems to be unreachable, retrying...'
        console.error(error)
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
        reponse = JSON.parse(decryptTextAes(response.encryptedData, key))
        global.myIp = response.publicIp
        global.config.ip = response.publicIp
        global.relayNode = true
        console.log(`announce as node ok`);
        global.trackerError = undefined
    } catch (error) {
        global.trackerError = 'tracker seems to be unreachable, retrying...'
        console.error(error)
        console.log(`error at announce`);
    }
}

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
