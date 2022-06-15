const express = require(`express`)
const bodyParser = require(`body-parser`)
const router = require(`express`).Router()
const fetch = require(`node-fetch`)
const fs = require(`fs`)
const { StatusCodes, ReasonPhrases, getReasonPhrase } = require(`http-status-codes`)
const utils = require(`./utils`)
const trackerApi = require(`./trackerAPI`)
const models = require(`./models`)
require(`./utils/keyInit`)
const app = express()
const procedures = require(`./procedures/keyrefresh`)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use((req, res, next) => {
    if (req.socket.localAddress === res.socket.remoteAddress)
        req.isLocalIp = true
    next()
})
let id = 0
router.get('/echo', (req, res) => {
    console.log(`client on echo. ip: ${req.ip} port: ${req.port}`);
    return res.status(200).end(`client on echo. ip: ${req.ip} port: ${req.port}`)
})

router.post(`/relay`, async function routeOnion(req, res) {
    console.log(`/relay`);
    //req body of shape json(transit cell)
    let onion
    let currentTransitCell
    let aesKey
    let currentId = ++id
    let prevPubKey
    try {
        prevPubKey = await utils.comm.getPublicKey(req.ip, req.body.requesterPort)
    } catch (error) {
        console.log(error)
        console.log(`cannot fetch prev node's publickey`)
        res.status(StatusCodes.BAD_REQUEST).end(`cannot fetch prev node's publickey`)
        return
    }
    try {
        currentTransitCell = req.body
        aesKey = utils.decrpytTextRsa(currentTransitCell.encryptedAesKey)
    } catch (error) {
        console.log(error)
        console.log(`error while decryptiong aes key`)
        res.status(StatusCodes.BAD_REQUEST).end(`error while decryptiong aes key`)
        return
    }
    try {
        onion = JSON.parse(utils.decryptTextAes(req.body.onion, aesKey))
        //validate onion, if not ok send bad request status code (1)

        if (!onion.message) { //means its onion to be forwarded
            if (onion.encryptExternalPayload) {
                utils.logTimestamp(`return msg`)
                currentTransitCell.externalPayload = utils.encrpytTextAes(currentTransitCell.externalPayload, onion.encryptExternalPayload)
                await new Promise(r => setTimeout(r, 500));
            }
            else {
                utils.logTimestamp(`fwd msg`)
                await new Promise(r => setTimeout(r, 500));
            }
            let transitCell = new models.TransitCell()
            transitCell.externalPayload = currentTransitCell.externalPayload
            transitCell.onion = onion.onionLayer
            transitCell.encryptedAesKey = onion.next.encryptedAesKey
            console.log(`[${config.port}][id: ${currentId}] got onion to fwd to ${onion.next.ip}:${onion.next.port}`)
            let response = await utils.comm.sendOnion(onion.next.ip, onion.next.port, transitCell)
            console.log(`[${config.port}][id: ${currentId}] onion fwd reponse message: ${response}`)
            return res.status(200).end(utils.encrpytTextRsa(response, prevPubKey))
        }

        if (onion.message.type == 'announce') {
            let result = await trackerApi.announcePiece(JSON.stringify(onion.message))
            return res.status(200).end(utils.encrpytTextRsa(result, prevPubKey))
        }

        //onion for me
        res.status(200).end(utils.encrpytTextRsa('ok', prevPubKey))
    } catch (error) {
        //Error: error:04099079:rsa routines:RSA_padding_check_PKCS1_OAEP_mgf1:oaep decoding error
        //  code: 'ERR_OSSL_RSA_OAEP_DECODING_ERROR'
        //inseamna ca am dat decode la ceva ce a fost criptat cu alta cheie
        console.log(error)
        return res.status(200).end(utils.encrpytTextRsa('failed', prevPubKey))
    }
    try {
        console.log(`got an onion for me`);
        //store the return onion while prep-ing an answer
        //...
        let transitCell = new models.TransitCell()
        if (onion.onionLayer) { // return onion
            utils.logTimestamp(`got a message for me with a return onion: "${onion.message}" `)
            transitCell.externalPayload = utils.encrpytTextAes('yes?', onion.encryptExternalPayload)
            transitCell.onion = onion.onionLayer
            transitCell.encryptedAesKey = onion.next.encryptedAesKey
            await new Promise(r => setTimeout(r, 2000))
            let nextNodeResponse = await utils.comm.sendOnion(onion.next.ip, onion.next.port, transitCell).catch(err => {
                console.log(`error occured when sending response: ${err}`)
            })

            console.log(`reponse: ${nextNodeResponse}`);
        }
        if (onion.message.startsWith(`key `)) {
            let key = onion.message.slice(4)
            console.log(`[RESPONSE] reponse onion for key: ${key}`)
            let decryptedData = utils.comm.decryptPayloadForKey(key, currentTransitCell.externalPayload)
            utils.logTimestamp(`[DECR]: ${decryptedData}`)
        }
    } catch (error) {
        console.log(error)
    }
})

router.get(`/test`, (req, res) => {
    let encr_text = utils.encrpytTextRsa(`ala bala porto cala`, global.publicKey)
    return res.status(201).json({
        encr_text: encr_text,
        decr_text: utils.decrpytTextRsa(encr_text, global.privateKey)
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
        let returnData = utils.comm.prepReturnOnion(hops)
        let { transitCell, nextIp, nextPort } = utils.comm.prepTransitCell(hops, destip, destport, destNodePbKey, message, payload, returnData)
        let fetchStatus = await utils.comm.sendOnion(nextIp, nextPort, transitCell)
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
    let aesKey = utils.generateAesKey()
    console.log(JSON.stringify(aesKey));
    let messageForTracker = {
        encrypedAesKey: utils.encrpytTextRsa(JSON.stringify(aesKey), trackerRsaPbKey),
        rsaPublicKey: trackerRsaPbKey,
        payload: 'return onion'
    }

    try {
        const { destip, destport, hopsNumber, payload } = req.body
        let hops = await trackerApi.fetchHops(hopsNumber, destip, destport)
        let destNodePbKey = await trackerApi.getPublicKeyOfNode(destip, destport)
        /** can do more queries just to protect the destinatary */
        console.log(hops);
        let returnOnion = utils.comm.prepReturnOnion(hops)
        let stringifiedPayload = JSON.stringify({
            announce: "ceva",
            returnOnion: JSON.stringify(returnOnion)
        })
        messageForTracker.payload = utils.encrpytTextAes(stringifiedPayload, aesKey)
        messageForTracker.type = 'announce'


        let { transitCell, nextIp, nextPort } = utils.comm.prepTransitCell(hops, destip, destport, destNodePbKey, messageForTracker)
        let fetchStatus = await utils.comm.sendOnion(nextIp, nextPort, transitCell)
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


router.get(`/publicKey`, async (req, res) => {
    res.status(200).json({
        publicKey: global.publicKeyString
    })
})

router.get(`/peers`, async (req, res) => {
    // demo
    const response = await fetch(`http://localhost:6969/scrape/nodes`) // cred ca ar trebui facut la tracker endpoint sa dea n ips random
    const data = await response.json();
    console.log(data);
    return res.status(200).end(JSON.stringify(
        data
    ))
})

router.post('/trackerUrl', async (req, res) => {
    const { trackerUrl } = req.body
    global.trackerUrl = trackerUrl
    try {//will anounce as node
        await procedures.startRefreshingLoop()
    } catch (error) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: error
        })
    }
    res.status(200).end()
})

app.use(`/`, router)

app.listen(config.port, () =>
    console.log(`Listening on ${config.ip}:${config.port}...`)
)


if (global.dev) {
    console.log(`dev mode enabled, tracker addr localhost`);
    setTimeout(async () => {
        await procedures.startRefreshingLoop()
    }, 1000)
}
