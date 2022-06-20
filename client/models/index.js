exports.Onion = class {
    next = {
        ip: '',
        port: 0
    }
    message = ''
    encryptExternalPayload = null
    newEncryptedAesKey = ''
    onionLayer = ''
}

exports.TransitCell = class {
    onion = ''
    encryptedAesKey = ''
    externalPayload = ''
}
