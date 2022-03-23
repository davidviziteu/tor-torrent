const express = require(`express`)
const bodyParser = require(`body-parser`)
const fetch = require(`node-fetch`)
const router = require(`express`).Router()
const { testingRoutes } = require(`./routes`)
const fs = require(`fs`)
const { StatusCodes, ReasonPhrases, getReasonPhrase } = require(`http-status-codes`)
const utils = require(`./utils`)
const { trackerApi } = require(`./utils`)
const models = require(`./models`)
require(`./utils/keyInit`)
const app = express()


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
let id = 0
router.post(`/route`, async function routeOnion(req, res) {
    console.log(`/route`);
    //req body of shape json(transit cell)
    let onion
    let currentTransitCell
    try {
        let currentId = ++id

        currentTransitCell = req.body
        let aesKey
        aesKey = utils.decrpytTextRsa(currentTransitCell.encryptedAesKey)

        onion = JSON.parse(utils.decryptTextAes(req.body.onion, aesKey))
        //validate onion, if not ok send bad request status code (1)

        if (onion.message == `fwd`) {
            if (onion.encryptExternalPayload) {
                utils.logTimestamp(`return msg`)
                currentTransitCell.externalPayload = utils.encrpytTextAes(currentTransitCell.externalPayload, onion.encryptExternalPayload)
                await new Promise(r => setTimeout(r, 2000));
            }
            else {
                utils.logTimestamp(`fwd msg`)
                await new Promise(r => setTimeout(r, 2000));
            }
            let transitCell = new models.TransitCell()
            transitCell.externalPayload = currentTransitCell.externalPayload
            transitCell.onion = onion.onionLayer
            transitCell.encryptedAesKey = onion.next.encryptedAesKey
            console.log(`[${config.port}][id: ${currentId}] got onion to fwd to ${onion.next.ip}:${onion.next.port}`)
            let fetchStatus = await utils.comm.sendOnion(onion.next.ip, onion.next.port, transitCell)
            //if timing ok
            console.log(`[${config.port}][id: ${currentId}] onion fwd reponse status: ${fetchStatus}`)
            switch (fetchStatus) {
                case StatusCodes.OK:
                case StatusCodes.BAD_REQUEST:
                case StatusCodes.REQUEST_TIMEOUT:
                    return res.status(fetchStatus).end()
                default:
                    return res.status(StatusCodes.REQUEST_TIMEOUT).end() //mark node as `out` 
            }
        }
        //onion for me
        res.status(200).end()
    } catch (error) {
        //Error: error:04099079:rsa routines:RSA_padding_check_PKCS1_OAEP_mgf1:oaep decoding error
        //  code: 'ERR_OSSL_RSA_OAEP_DECODING_ERROR'
        //inseamna ca am dat decode la ceva ce a fost criptat cu alta cheie
        console.log(error)
        return res.status(StatusCodes.BAD_REQUEST).end(ReasonPhrases.BAD_REQUEST)
    }
    try {
        console.log(`got an onion for me`);
        //store the return onion while prep-ing an answer
        //...
        let transitCell = new models.TransitCell()
        if (onion.onionLayer) { // return onion
            utils.logTimestamp(`got a message for me with a return onion`)
            transitCell.externalPayload = utils.encrpytTextAes('yes?', onion.encryptExternalPayload)
            transitCell.onion = onion.onionLayer
            transitCell.encryptedAesKey = onion.next.encryptedAesKey
            await new Promise(r => setTimeout(r, 2000));
            let recv = await utils.comm.sendOnion(onion.next.ip, onion.next.port, transitCell).catch(err => {
                console.log(`error occured when sending response: ${err}`)
            })
            if (!recv.ok)
                console.log(`response did not reach it's desinatary: ${recv.status}`)
            console.log(`reponse sent`);
        }
        if (onion.message.startsWith(`key `)) {
            let key = onion.message.slice(4)
            console.log(`[RESPONSE] reponse onion for key: ${key}`)
            let decryptedData = utils.comm.decryptPayloadForKey(key, currentTransitCell.externalPayload)
            utils.logTimestamp(`[DECR]: ${decryptedData}`);
        }
    } catch (error) {
        console.log(error)
        console.log(`error when decrypting the return onion`)
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
        res.status(fetchStatus).end(
            getReasonPhrase(fetchStatus)
        )
    }
    catch (error) {
        console.log(error);
        res.status(StatusCodes.BAD_REQUEST).end()
    }
})


router.get(`/peers`, async (req, res) => {
    const response = await fetch(`http://localhost:6969/scrape/nodes`) // cred ca ar trebui facut la tracker endpoint sa dea n ips random
    const data = await response.json();
    console.log(data);
    return res.status(200).end(JSON.stringify(
        data
    ))
})

app.use(`/`, router)
app.use(`/testing`, testingRoutes)
app.listen(config.port, () =>
    console.log(`Listening on ${config.ip}:${config.port}...`)
)

setTimeout(utils.trackerApi.announce, 1000)
