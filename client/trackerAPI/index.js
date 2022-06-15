const fetch = require('node-fetch');
const { encrpytTextAes, generateAesKey, encrpytTextRsa, decryptTextAes } = require('../utils')

//done
exports.fetchHops = async () => {
    if (!trackerAddress) {
        console.log(`trackerAddress is not defined`)
        process.exit(1)
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
        return JSON.parse(decryptTextAes(response.encryptedData, aesKey))
    } catch (error) {
        console.error(error)
        console.log(`error at fetching relay list from tracker`);
    }
}

//done
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
        console.log(`trackerAddress is not defined`)
        process.exit(1)
    }
    try {
        const response = await (await fetch(global.trackerAddress + `/public-key`)).json()
        global.trackerPbKey = response.publicKey
        return response.publicKey
    } catch (error) {
        console.error(error)
        console.log(`error at fetching public key from tracker, quitting..`);
        process.exit(1)
    }
}
