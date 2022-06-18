console.log(`\n\n\n\n\n\n\n\n`);
require('./utils/init')
const express = require('express')
const bodyParser = require('body-parser')
const models = require('./models')
const cryptoApi = require('./utils/cryptoApi')
const router = require('express').Router()
const { StatusCodes } = require('http-status-codes')
const utils = require('./utils/utils')

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use((req, res, next) => {
    if (req.socket.localAddress === res.socket.remoteAddress)
        req.isLocalIp = true
    next()
})

//ok
router.post('/session', (req, res) => {
    let data = cryptoApi.decryptValidateBody(req, res, null, true)
    if (!data) return

    cryptoApi.sendDataEncrypted(res, data.key, {
        timeLeftMs: (global.lastSessionRefresh + global.sessionDurationMinutes) - Date.now(),
        refreshPeriodMs: global.sessionDurationMinutes, //este de fapt in ms
    })
})

//ok
router.get('/public-key', (req, res) => {
    return res.status(200).json({
        publicKey: global.publicKeyString
    })
})

//ok
router.post('/announce/relay', (req, res) => {
    console.log('announce relay')
    let data = cryptoApi.decryptValidateBody(req, res, models.relayNodeAnnouceSchema)
    if (!data) return

    if (req.isLocalIp)
        data.ip = `localhost`
    else
        data.ip = req.ip
    console.log(`new peer: ${data.ip}:${data.port}`)
    global.relaysMap[`${data.ip}:${data.port}`] = {
        publicKey: data.publicKey,
        port: data.port,
        ip: data.ip
    }
    cryptoApi.sendDataEncrypted(res, data.key, {
        publicIp: data.ip
    })
    console.log(`\trelay added. port: ${data.port}`)
})

//ok
router.post('/announce', (req, res) => {
    let data = cryptoApi.decryptValidateBody(req, res, models.leecherAnnounceSchema)
    if (!data) return

    try {
        if (global.leechersMap.has(data.infoHash)) {
            let leechers = global.leechersMap.get(data.infoHash)
            if (leechers)
                global.leechersMap.set(data.infoHash, [...leechers, ...data])
            else
                global.leechersMap.set(data.infoHash, data)
        }
        return cryptoApi.sendDataEncrypted(res, data.key, {
            error: null
        })
    } catch (error) {
        console.log(error);
        console.log(`error when adding leecher to leechersMap for infoHash: ${data.infoHash}`);
        cryptoApi.sendDataEncrypted(res, data.key, {
            error: error
        })
    }
})

//ok
router.post('/scrape/relay', (req, res) => {
    let data = cryptoApi.decryptValidateBody(req, res, null, true)
    if (!data) return
    const relayArr = Object.values(global.relaysMap)
    let dataToReturn = utils.randomOfArray(relayArr, global.maxRelayNodesReturned)
    cryptoApi.sendDataEncrypted(res, data.key, dataToReturn)
})

//ok
router.post('/scrape', (req, res) => {
    let data = cryptoApi.decryptValidateBody(req, res, models.leecherRequestSchema)
    if (!data) return

    //data is an array of infohashes
    let dataToReturn = {}
    data.forEach(infoHash => {
        if (global.leechersMap.has(infoHash)) {
            let leechers = global.leechersMap.get(infoHash)
            if (leechers)
                dataToReturn[infoHash] = utils.randomOfArray(leechers, global.maxLeecherNodesReturned)
            else
                dataToReturn[infoHash] = []
        }
    })
    cryptoApi.sendDataEncrypted(res, data.key, dataToReturn)
})

router.all('/*', (req, res) => {
    res.status(StatusCodes.NOT_FOUND).json({
        error: `${req.method} on ${req.path} not avilable / found`
    })
})

app.use('/', router)

app.listen(global.port, () =>
    console.log(`Listening on ${global.ip}:${global.port}...`)
)