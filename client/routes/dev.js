const router = require(`express`).Router()
const trackerApi = require(`../utils/trackerApi`)
const AppManager = require('../utils/appDataManager');
const { StatusCodes } = require('http-status-codes')

router.get('/dev', (req, res) => {
    return res.status(200).json({
        "client ip": req.ip,
        refreshLoopStarted: global.refreshLoopStarted,
        trackerAddress: global.trackerAddress,
        trackerError: global.trackerError,
        keysError: global.keysError,
    })
})

router.post(`/testRouting`, async (req, res) => {
    //trb dest ip si dest port, hopsNumber, message si payload
    console.log(`test routing`);
    try {
        const { destip, destport, hopsNumber, message, payload } = req.body
        let hops = await trackerApi.fetchHops(hopsNumber, destip, destport)
        let destNodePbKey = await trackerApi.getPublicKeyOfNode(destip, destport)
        console.log(hops);
        let returnData = cryptoApi.comm.prepReturnOnion(hops)
        let { transitCell, nextIp, nextPort } = cryptoApi.comm.prepTransitCell(hops, destip, destport, destNodePbKey, message, payload, returnData)
        let fetchStatus = await cryptoApi.comm.sendOnion(nextIp, nextPort, transitCell)
        console.log(`send onion status: ${fetchStatus}`)
        res.status(200).end()
    }
    catch (error) {
        console.log(error);
        res.status(StatusCodes.BAD_REQUEST).end()
    }
})

router.post(`/announce`, async (req, res) => {
    //trb dest ip si dest port, hopsNumber, message si payload
    console.log(`test announce`);
    let trackerRsaPbKey = await trackerApi.generatePublicKey()
    if (!trackerRsaPbKey)
        return res.status(StatusCodes.CONFLICT).json({ error: 'tracker returned nothing' })
    let aesKey = cryptoApi.generateAesKey()
    console.log(JSON.stringify(aesKey));
    let messageForTracker = {
        encrypedAesKey: cryptoApi.encrpytTextRsa(JSON.stringify(aesKey), trackerRsaPbKey),
        rsaPublicKey: trackerRsaPbKey,
        payload: 'return onion'
    }

    try {
        const { destip, destport, hopsNumber, payload } = req.body
        let hops = await trackerApi.fetchHops(hopsNumber, destip, destport)
        let destNodePbKey = await trackerApi.getPublicKeyOfNode(destip, destport)
        /** can do more queries just to protect the destinatary */
        console.log(hops);
        let returnOnion = cryptoApi.comm.prepReturnOnion(hops)
        let stringifiedPayload = JSON.stringify({
            announce: "ceva",
            returnOnion: JSON.stringify(returnOnion)
        })
        messageForTracker.payload = cryptoApi.encrpytTextAes(stringifiedPayload, aesKey)
        messageForTracker.type = 'announce'


        let { transitCell, nextIp, nextPort } = cryptoApi.comm.prepTransitCell(hops, destip, destport, destNodePbKey, messageForTracker)
        let fetchStatus = await cryptoApi.comm.sendOnion(nextIp, nextPort, transitCell)
        console.log(`send onion status: ${fetchStatus}`)
        res.status(200).json({
            "send onion status": fetchStatus
        })
    }
    catch (error) {
        console.log(error);
        res.status(StatusCodes.BAD_REQUEST).json({
            error: error
        })
    }
})


router.post('/override-tracker-url/', async (req, res) => {
    const { trackerurl } = req.body
    if (!trackerurl) return res.status(StatusCodes.BAD_REQUEST).json({ error: 'no tracker url provided' })
    global.trackerAddress = trackerurl
    res.status(200).end()
})

module.exports = router