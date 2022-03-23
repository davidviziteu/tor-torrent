
const crypto = require("crypto");
const fetch = require(`node-fetch`)
exports.trackerApi = require('./trackerAPI.js')
exports.comm = require('./comm.js')
exports.encrpytTextRsa = (text, publicKey) => {
    //works with string public key as well
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
    console.log(`key: ${key}`); //bug: aici intra key cu null
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