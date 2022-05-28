const algorithm = 'aes-256-cbc';
const express = require('express')
const bodyParser = require('body-parser')
const models = require('./models')
const router = require('express').Router()
const crypto = require(`crypto`)
const fs = require('fs')
const { StatusCodes } = require('http-status-codes')
const rsaModulusLength = 1024 * 2
console.log(`\n\n\n\n\n\n\n\n\n\n\n`);
let config
try {
    config = JSON.parse(process.argv[2].replaceAll(`'`, `"`))
} catch {
    config = {
        "ip": "localhost",
        "port": 6969
    }
}
const Joi = require('joi')

function randomNumber(max) {
    return Math.floor(Math.random() * max)
}

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use((req, res, next) => {
    if (req.socket.localAddress === res.socket.remoteAddress)
        req.isLocalIp = true
    next()
})
let nodesMap = new Map()
let rsaKeyMap = new Map()
let nodesArray = new Array()

router.post('/announce/node', (req, res) => {
    const { error, value } = models.trackerAnnounceSchema.validate(req.body);
    if (error)
        return res.status(StatusCodes.BAD_REQUEST).end(JSON.stringify({
            error: error
        }))
    if (req.isLocalIp)
        value.ip = `localhost`
    else
        value.ip = req.ip
    console.log(`new peer: ${value.ip}:${value.port}`) //ip ul il iei din req.ip nu din body
    nodesMap.set(`${value.ip}:${value.port}`, value) //change here from body
    return res.status(StatusCodes.OK).end(JSON.stringify({
        result: "ok",
        publicIp: value.ip
    }))
})

const parseAesKey = key => {
    if (typeof key === 'string' || key instanceof String)
        return JSON.parse(key)
    return key
}


const decrpytTextRsa = (text, key) => {
    const encryptedData = Buffer.from(text, 'base64')
    const decryptedData = crypto.privateDecrypt(
        {
            key: key,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        encryptedData
    );
    return decryptedData.toString()
}

const decryptTextAes = (text, key) => {
    key = parseAesKey(key)
    let encryptedText = Buffer.from(text, 'base64');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key.key, 'base64'), Buffer.from(key.iv, 'base64'));
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}


router.post('/announce/piece', (req, res) => {
    //need id in the req body or in the url
    try {
        console.log(`POST on /announce/piece`);
        let { encrypedAesKey, rsaPublicKey, payload } = req.body
        const { privateKey } = rsaKeyMap.get(rsaPublicKey)
        console.log('\tbody:');
        let aesKey = decrpytTextRsa(encrypedAesKey, privateKey)
        payload = JSON.parse(decryptTextAes(payload, aesKey))
        console.log(JSON.stringify(payload));
        return res.status(StatusCodes.OK).end(JSON.stringify({
            result: `ok - mock`,
        }))
    } catch (error) {
        console.log('\tno key in map');
        return res.status(StatusCodes.BAD_REQUEST).end()
    }
})

let hitsCount = 0
let refreshMapHitsCount = 10
let mapCacheTimeHours = 0.2

router.post('/announce/torrent', (req, res) => {

    return res.status(StatusCodes.OK).json({
        uid: "ok - mock",
    })
})

router.get('/scrape/nodes', (req, res) => {
    res.status(StatusCodes.OK).json({
        peersArray: [...nodesMap.values()]
    })
})

const getRandomKeyOfMap = map => [...map.keys()][Math.floor(Math.random() * map.size)]

router.get('/public-key/:ip/:port', (req, res) => {
    let node = nodesMap.get(`${req.params.ip}:${req.params.port}`)
    if (node)
        return res.status(200).json({
            publicKey: node.publicKey
        })
    return res.status(StatusCodes.NOT_FOUND).end()
})

router.post('/public-key', (req, res) => {
    hitsCount++
    if (hitsCount == refreshMapHitsCount) {
        let mapKeys = [...rsaKeyMap.keys()]
        for (const { dateAdded } in mapKeys) {
            let hoursDiff = Math.abs(Date.parse(dateAdded) - Date.now()) / 36e5;
            if (hoursDiff > mapCacheTimeHours)
                rsaKeyMap.delete(dateAdded)
        }
        hitsCount = 0 //resets counter
    }
    try {
        const { publicKey, privateKey } = crypto.generateKeyPairSync(`rsa`, {
            modulusLength: rsaModulusLength,
        })
        const stringPbKey = publicKey.export({
            format: `pem`,
            type: `spki`
        })
        rsaKeyMap.set(stringPbKey, {
            privateKey: privateKey,
            dateAdded: Date.now()
        })
        return res.status(200).json({
            publicKey: stringPbKey
        })
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: error
        })
    }
})


router.get('/scrape/nodes/:count', (req, res) => {
    //the requester should ask a +1 node in case the list contains itself and the destinatary node
    console.log('scraping nodes count');
    let nodes = []
    if (nodesMap.size < req.params.count)
        return res.status(StatusCodes.PARTIAL_CONTENT).json({ nodes: nodesArray })

    let i = 0

    let usedIndexes = []
    let keysArray = [...nodesMap.keys()]
    let idx
    let randomKey
    let selectedNode
    while (i < req.params.count) {
        idx = randomNumber(nodesMap.size)
        randomKey = keysArray[idx]
        selectedNode = nodesMap.get(randomKey)
        if (usedIndexes.indexOf(idx) == -1) {
            usedIndexes.push(idx)
            nodes.push(selectedNode)
            i++
        }
    }

    res.status(StatusCodes.OK).json({
        nodes: nodes
    })
})

app.use('/', router)

app.listen(config.port, () =>
    console.log(`Listening on ${config.ip}:${config.port}...`)
)