console.log(`\n\n\n\n\n\n\n\n\n\n\n`);
require('./utils/init')
const express = require('express')
const bodyParser = require('body-parser')
const models = require('./models')
const cryptoApi = require('./utils/cryptoApi')
const router = require('express').Router()
const crypto = require(`crypto`)
const { StatusCodes } = require('http-status-codes')
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
    let data = cryptoApi.decryptValidateBody(req, res, null, true)
    if (!data) return

    cryptoApi.sendDataEncrypted(res, data.key, {
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
    let data = cryptoApi.decryptValidateBody(req, res, models.trackerAnnounceSchema.validate)
    if (!data) return

    if (req.isLocalIp)
        data.ip = `localhost`
    else
        data.ip = req.ip
    console.log(`new peer: ${data.ip}:${data.port}`)
    relaysArray.push(data)
    cryptoApi.sendDataEncrypted(res, data.key, {
        result: "ok",
        publicIp: data.ip
    })
})


router.post('/announce/', (req, res) => {
    let data = cryptoApi.decryptValidateBody(req, res, models.trackerTorrentAnnounceSchema.validate)
    if (!data) return
    try {
        if (global.torrentsLeechers.has(data.infoHash)) {
            let leechers = global.torrentsLeechers.get(data.infoHash)
            if (leechers)
                global.torrentsLeechers.set(data.infoHash, [...leechers, ...data])
            else
                global.torrentsLeechers.set(data.infoHash, data)
        }
        return res.status(200).end()
    } catch (error) {
        console.log(error);
        console.log(`error when adding leecher to torrentsLeechers for infoHash: ${data.infoHash}`);
        cryptoApi.sendDataEncrypted(res, data.key, {
            error: error
        })
    }
})

router.get('/scrape/relay', (req, res) => {
    let data = cryptoApi.decryptValidateBody(req, res)
    if (!data) return
    let dataToReturn = cryptoApi.randomOfArray(global.relaysArray)
    cryptoApi.sendDataEncrypted(res, data.key, {
        relaysArray: dataToReturn
    })
})

router.get('/scrape', (req, res) => {
    let data = cryptoApi.decryptValidateBody(req, res)
    if (!data) return
    if (global.torrentsLeechers.has(data.infoHash)) {
        let leechers = global.torrentsLeechers.get(data.infoHash)
        let dataToReturn = cryptoApi.randomOfArray(leechers, global.maxLeechersReturned)
        cryptoApi.sendDataEncrypted(res, data.key, {
            leechersArray: dataToReturn
        })
    }
    else
        cryptoApi.sendDataEncrypted(res, data.key, {
            leechersArray: []
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