
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

exports.generateId = (ipaddr) => {
    return CRC32.str(ipaddr + this.getRandomArbitrary(100, 1000))
}


exports.decryptValidateBody = (req, res, schema = null, keyOnly = false) => {
    const { encryptedKey, encryptedData } = req.body

    if (!encryptedKey || keyOnly ? false : !encryptedData) {
        if (global.dev) {
            res.status(400).json({
                error: 'no body'
            })
            return null
        }
        res.end()
        return null
    }



    let key, data = {}
    if (global.dev && encryptedKey === 'postman')
        try {
            if (encryptedData)
                data = JSON.parse(encryptedData)
            key = encryptedKey
        } catch (error) {
            res.json({
                error: "json parse failed"
            })
            return null
        }
    else {
        try {
            key = this.decrpytTextRsa(encryptedKey, global.privateKey)
            if (encryptedData)
                data = JSON.parse(this.decryptTextAes(encryptedData, key))
        } catch (error) {
            console.log(error)
            if (global.dev)
                res.status(200).json({
                    error: 'invalid key',
                })
            return null
        }
    }

    if (schema) {
        const { error, value } = schema.validate(data)
        if (error) {
            if (global.dev)
                res.status(200).json({
                    error: error,
                })
            return null
        }
        value.key = key
        return value
    }
    data.key = key
    return data
}

exports.sendDataEncrypted = (res, key, data) => {
    try {
        if (global.dev) {
            if (key === 'postman') {
                res.json(data)
                return
            }
        }
        const encryptedData = this.encrpytTextAes(JSON.stringify(data), key)
        return res.json({
            encryptedData: encryptedData,
        })
    } catch (error) {
        console.log(error)
        if (global.dev) {
            return res.json({
                error: error,
            })
        }
        return res.end()
    }
}

exports.randomOfArray = (array, count = 30) => {
    if (array.length <= count) {
        return array
    }
    let dataToReturn = []
    for (let index = 0; index < count; index++) {
        dataToReturn.push(array[this.getRandomArbitrary(0, array.length - 1)])
    }
    return dataToReturn
}