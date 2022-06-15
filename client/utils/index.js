const fetch = require('node-fetch');

const crypto = require("crypto");
exports.encrpytTextRsa = (text, publicKey) => {
    //works with string public key as well

    if (typeof text !== 'string' && !(text instanceof String))
        text = JSON.stringify(text)

    const encryptedData = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        Buffer.from(text)
    );
    return encryptedData.toString('base64')
}

exports.decrpytTextRsa = (text) => {
    const encryptedData = Buffer.from(text, 'base64')
    const decryptedData = crypto.privateDecrypt(
        {
            key: global.privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        encryptedData
    );
    return decryptedData.toString()
}


const algorithm = 'aes-256-cbc';

exports.generateAesKey = () => {
    return {
        key: crypto.randomBytes(32).toString('base64'),
        iv: crypto.randomBytes(16).toString('base64'),
    }
}

const parseAesKey = key => {
    if (typeof key === 'string' || key instanceof String)
        return JSON.parse(key)
    return key
}

exports.encrpytTextAes = (text, key) => {
    key = parseAesKey(key)

    if (typeof text !== 'string' && !(text instanceof String))
        text = JSON.stringify(text)

    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key.key, 'base64'), Buffer.from(key.iv, 'base64'));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('base64')
}

exports.decryptTextAes = (text, key) => {
    key = parseAesKey(key)
    let encryptedText = Buffer.from(text, 'base64');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key.key, 'base64'), Buffer.from(key.iv, 'base64'));
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

exports.logTimestamp = msg => {
    let now = new Date()
    console.log(`${msg} ${now.getMinutes()}m ${now.getSeconds()}s ${now.getMilliseconds()}ms`)
}

exports.getRandomArbitrary = (min, max) => {
    return Math.random() * (max - min) + min;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.refreshPbKeys = async (refreshPeriodMs = null) => {
    if (!trackerAddress) {
        console.log(`trackerAddress is not defined`)
        process.exit(1)
    }
    await updateTrackerPublicKey()
    try {
        const { publicKey, privateKey } = crypto.generateKeyPairSync(`rsa`, {
            modulusLength: configurations.modulusLength ? configurations.modulusLength : 2048,
        })
        global.publicKey = publicKey
        global.privateKey = privateKey
        global.publicKeyString = publicKey.export({
            format: `pem`,
            type: `spki`
        })
        console.log('ok key refresh');

        if (refreshPeriodMs) {
            setInterval(() => { refreshPbKeys(refreshPeriodMs) }, refreshPeriodMs)
        }
        else {
            let refreshPeriodObj = await getRefreshPeriod(trackerPbKey)
            if (refreshPeriodObj.timeLeftMs < 5000) {
                await sleep(5010)
                refreshPbKeys()
            }
            setTimeout(() => refreshPbKeys(refreshPeriodObj.refreshPeriodMs),
                refreshPeriodObj.timeLeftMs
            )
        }


    } catch (error) {
        console.log(error);
        console.log('error when generating keys, exiting..');
        process.exit(1);
    }
}


let updateTrackerPublicKey = async () => {
    try {
        const response = await (await fetch(global.trackerAddress + `/public-key`)).json()
        global.trackerPbKey = response.publicKey
        return true
    } catch (error) {
        console.error(error)
        console.log(`error at fetching public key from tracker, setting it to undefined..`);
        global.trackerPbKey = undefined
        return false
    }
}

exports.updateTrackerPublicKey = updateTrackerPublicKey


let getRefreshPeriod = async (trackerPbKey) => {
    //if not updated...
    await updateTrackerPublicKey()
    try {
        aesKey = this.generateAesKey()
        const r = await fetch(global.trackerAddress + `/session`,
            {
                headers: { "Content-Type": "application/json" },
                method: `POST`,
                body: JSON.stringify({
                    encryptedKey: this.encrpytTextRsa(aesKey, trackerPbKey),
                })
            })
        const response = await (r).json()

        if (!response.encryptedData || response.error) {
            console.log(`error tracker didnt return refresh period`);
            console.log(`error: ${response.error}`);
            throw `error tracker didnt return refresh period`
        }
        return JSON.parse(this.decryptTextAes(response.encryptedData, aesKey))
    } catch (error) {
        console.error(error)
        console.log(`error at fetching refresh period from tracker`);
    }
}

global.getRefreshPeriod = getRefreshPeriod
