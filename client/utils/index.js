const crypto = require("crypto");
const models = require('../models')
const fetch = require(`node-fetch`)

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

exports.properFetchPost = (url, body) => {
    return fetch(url, {
        method: `POST`,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
}


exports.prepTransitCell = (hops, destip, destport, destPbKey, message, payload) => {
    //hop: [{ip, port, publicKey, aesKey}, {same}]

    let finalOnion = new models.Onion()
    finalOnion.message = message // != fwd
    finalOnion.next.ip = 'TODO ip of the first node in the return path'
    finalOnion.next.port = 'TODO port of the first node in the return path'
    finalOnion.next.encryptedAesKey = 'TODO aes key used to decypt the first layer of the return onion'
    finalOnion.onionLayer = 'TODO this will be the return onion'
    let allHops = [{
        ip: destip,
        port: destport,
        publicKey: destPbKey
    }].concat(hops)

    let portsOrder = []
    let keysOrder = []

    let currentOnion = new models.Onion()
    let currentAesKey = this.generateAesKey()
    let prevAesKeyObj = currentAesKey
    // currentOnion.onionLayer = 
    prevOnion = finalOnion
    let i
    for (i = 0; i < allHops.length - 1; i++) {
        const hop = allHops[i];
        currentOnion = new models.Onion()
        currentOnion.onionLayer = this.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj)
        currentOnion.next.encryptedAesKey = this.encrpytTextRsa(JSON.stringify(prevAesKeyObj), hop.publicKey)
        currentOnion.next.aesPublicKey = hop.publicKey
        currentOnion.next.ip = hop.ip
        currentOnion.next.port = hop.port
        portsOrder = [hop.port].concat(portsOrder)
        keysOrder = [hop.publicKey].concat(keysOrder)
        ip = hop.ip
        port = hop.port
        currentOnion.message = 'fwd'
        currentOnion.encryptExternalPayload = false //tre vazut ce pun aici..
        prevOnion = JSON.parse(JSON.stringify(currentOnion))
        prevAesKeyObj = this.generateAesKey()
    }

    let transitCell = new models.TransitCell()
    transitCell.externalPayload = payload
    transitCell.onion = this.encrpytTextAes(JSON.stringify(prevOnion), prevAesKeyObj)
    transitCell.encryptedAesKey = this.encrpytTextRsa(JSON.stringify(prevAesKeyObj), allHops[i].publicKey)
    transitCell.aesPublicKey = allHops[i].publicKey
    keysOrder = [allHops[i].publicKey].concat(keysOrder)
    portsOrder = [allHops[i].port].concat(portsOrder) //for debugging
    console.log(portsOrder);
    return { transitCell: transitCell, nextIp: allHops[i].ip, nextPort: allHops[i].port }
}

