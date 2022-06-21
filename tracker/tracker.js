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
    if (!data || !data.key) {
        console.log(`/session request has no data or key decrpytion failed`);
        return
    }

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
    if (!data || !data.key) {
        console.log(`/announce/relay request has no data or key decrpytion failed`);
        return
    }

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

let replyOnions = 0
//ok
router.post('/announce', (req, res) => {
    let data = cryptoApi.decryptValidateBody(req, res, models.leecherAnnounceSchema)
    if (!data || !data.key) {
        console.log(`/announce request has no data or key decrpytion failed`);
        return
    }
    for (let i = 0; i < data.length; i++) {
        let torrent = data[i]
        try {
            if (global.leechersMap.has(torrent.infoHash)) {
                let leechers = global.leechersMap.get(torrent.infoHash)
                if (leechers)
                    global.leechersMap.set(torrent.infoHash, [...leechers, ...torrent.replyOnions])
                else
                    global.leechersMap.set(torrent.infoHash, [...torrent.replyOnions])
            }
            else {
                global.leechersMap.set(torrent.infoHash, [...torrent.replyOnions])
            }
            console.log('\tannounce torrent added.')
            replyOnions += torrent.replyOnions.length
            return cryptoApi.sendDataEncrypted(res, data.key, {
                error: null
            })
        } catch (error) {
            console.log(error);
            console.log(`error when adding leecher to leechersMap for infoHash: ${torrent.infoHash}`);
        }
    }
})

//ok
router.post('/scrape/relay', (req, res) => {
    let data = cryptoApi.decryptValidateBody(req, res, null, true)
    if (!data || !data.key) {
        console.log(`/scrape/relay request has no data or key decrpytion failed`);
        return
    }
    const relayArr = Object.values(global.relaysMap)
    let dataToReturn = utils.randomOfArray(relayArr, global.maxRelayNodesReturned)
    cryptoApi.sendDataEncrypted(res, data.key, dataToReturn)
})


router.get('/scrape/relay/count', (req, res) => { //DEBUG
    const relayArr = Object.values(global.relaysMap)
    return res.status(200).json({
        relayNodes: relayArr.length
    })
})


//ok
router.post('/scrape', (req, res) => {
    let data = cryptoApi.decryptValidateBody(req, res, models.leecherRequestSchema)
    if (!data || !data.key) {
        console.log(`/scrape request has no data or key decrpytion failed`);
        return
    }

    //data is an array of infohashes
    let dataToReturn = {}
    for (let index = 0; index < data.length; index++) {
        const infoHash = data[index];
        if (global.leechersMap.has(infoHash)) {
            let leechers = global.leechersMap.get(infoHash)
            if (leechers)
                dataToReturn[infoHash] = utils.randomOfArray(leechers, global.maxLeecherNodesReturned)
            else
                dataToReturn[infoHash] = []
        }
    }
    cryptoApi.sendDataEncrypted(res, data.key, dataToReturn)
})

router.get('/scrape/count', (req, res) => { //DEBUG
    return res.status(200).json({
        replyOnions: replyOnions
    })
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