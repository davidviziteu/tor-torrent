console.log(`\n\n\n\n\n\n\n\n\n\n\n`);
require('./utils/init')
const express = require('express')
const bodyParser = require('body-parser')
const models = require('./models')
const cryptoApi = require('./utils/cryptoApi')
const router = require('express').Router()
const crypto = require(`crypto`)
const { StatusCodes } = require('http-status-codes')
global.nodesMap = new Map()
global.nodesArray = new Array()
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

router.get('/session', (req, res) => {
    res.status(200).json({
        sessionId: global.sessionId,
        timeLeftMs: (global.lastSessionRefresh + global.sessionDurationMinutes) - Date.now(),
        refreshPeriosMinutes: global.sessionDurationMinutes / 60000,
    })
})

router.get('/public-key', (req, res) => {
    return res.status(200).json({
        publicKey: global.publicKeyString
    })
})

router.post('/announce/relay', (req, res) => {
    const { encryptedKey, encryptedData } = req.body
    let key, data
    try {
        key = cryptoApi.decrpytTextRsa(encryptedKey, global.privateKey)
        data = JSON.parse(cryptoApi.decryptTextAes(encryptedData, key))
    } catch (error) {
        console.log(error)
        res.status(StatusCodes.OK).json({
            error: 'invalid key',
        })
    }
    const { error, value } = models.trackerAnnounceSchema.validate(data);
    if (error)
        return res.status(StatusCodes.BAD_REQUEST).end(JSON.stringify({       //TODO CRIPTEAZA CU AES
            error: error
        }))
    if (req.isLocalIp)
        value.ip = `localhost`
    else
        value.ip = req.ip
    console.log(`new peer: ${value.ip}:${value.port}`)
    nodesMap.set(`${value.ip}:${value.port}`, value)
    return res.status(StatusCodes.OK).end(JSON.stringify({                 //TODO CRIPTEAZA CU AES
        result: "ok",
        publicIp: value.ip
    }))
})


router.post('/announce/:torrent', (req, res) => {
    //need id in the req body or in the url
    try {
        console.log(`POST on /announce/torrent`);
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

router.post('/announce/:torrent', (req, res) => {

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

router.all('*', (req, res) => {
    res.status(StatusCodes.NOT_FOUND).json({
        error: 'route not found'
    })
})

app.use('/', router)

app.listen(global.port, () =>
    console.log(`Listening on ${global.ip}:${global.port}...`)
)