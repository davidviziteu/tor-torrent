const router = require(`express`).Router()
const models = require(`../models`)
const cryptoApi = require(`../utils/cryptoApi`)
const { StatusCodes } = require('http-status-codes')
const AppStatsManager = require('../utils/appStatsManager')
let id = 0
router.post(`/relay`, async function routeOnion(req, res) {
    console.log(`/relay`);
    //req body of shape json(transit cell)
    let onion
    let currentTransitCell
    let aesKey
    let currentId = ++id
    let prevPubKey
    try {
        prevPubKey = await cryptoApi.comm.getPublicKey(req.ip, req.body.requesterPort)
    } catch (error) {
        console.log(error)
        console.log(`cannot fetch prev node's publickey`)
        res.status(StatusCodes.BAD_REQUEST).end(`cannot fetch prev node's publickey`)
        return
    }
    try {
        currentTransitCell = req.body
        aesKey = cryptoApi.decrpytTextRsa(currentTransitCell.encryptedAesKey)
    } catch (error) {
        console.log(error)
        console.log(`error while decryptiong aes key`)
        res.status(StatusCodes.BAD_REQUEST).end(`error while decryptiong aes key`)
        return
    }
    try {
        onion = JSON.parse(cryptoApi.decryptTextAes(req.body.onion, aesKey))
        //validate onion, if not ok send bad request status code (1)

        if (!onion.message) { //means its onion to be forwarded
            if (onion.encryptExternalPayload) {
                cryptoApi.logTimestamp(`return msg`)
                currentTransitCell.externalPayload = cryptoApi.encrpytTextAes(currentTransitCell.externalPayload, onion.encryptExternalPayload)
                await new Promise(r => setTimeout(r, 500));
            }
            else {
                cryptoApi.logTimestamp(`fwd msg`)
                await new Promise(r => setTimeout(r, 500));
            }
            let transitCell = new models.TransitCell()
            transitCell.externalPayload = currentTransitCell.externalPayload
            transitCell.onion = onion.onionLayer
            transitCell.encryptedAesKey = onion.next.encryptedAesKey
            console.log(`[${config.port}][id: ${currentId}] got onion to fwd to ${onion.next.ip}:${onion.next.port}`)
            let response = await cryptoApi.comm.sendOnion(onion.next.ip, onion.next.port, transitCell)
            console.log(`[${config.port}][id: ${currentId}] onion fwd reponse message: ${response}`)
            return res.status(200).end(cryptoApi.encrpytTextRsa(response, prevPubKey))
        }

        if (onion.message.type == 'announce') {
            let result = await trackerApi.announcePiece(JSON.stringify(onion.message))
            return res.status(200).end(cryptoApi.encrpytTextRsa(result, prevPubKey))
        }

        //onion for me
        res.status(200).end(cryptoApi.encrpytTextRsa('ack', prevPubKey))
    } catch (error) {
        //Error: error:04099079:rsa routines:RSA_padding_check_PKCS1_OAEP_mgf1:oaep decoding error
        //  code: 'ERR_OSSL_RSA_OAEP_DECODING_ERROR'
        //inseamna ca am dat decode la ceva ce a fost criptat cu alta cheie
        console.log(error)
        return res.status(200).end(cryptoApi.encrpytTextRsa('failed', prevPubKey))
    }
    try {
        console.log(`got an onion for me`);
        //store the return onion while prep-ing an answer
        //...
        // if ul asta de jos a fost folosit pt teste mai mult.
        let transitCell = new models.TransitCell()
        if (onion.onionLayer) { // reply onion
            cryptoApi.logTimestamp(`got a message for me with a return onion: "${onion.message}" `)
            transitCell.externalPayload = cryptoApi.encrpytTextAes('yes?', onion.encryptExternalPayload)
            transitCell.onion = onion.onionLayer
            transitCell.encryptedAesKey = onion.next.encryptedAesKey
            await new Promise(r => setTimeout(r, 2000))
            let nextNodeResponse = await cryptoApi.comm.sendOnion(onion.next.ip, onion.next.port, transitCell).catch(err => {
                console.log(`error occured when sending response: ${err}`)
            })

            console.log(`reponse: ${nextNodeResponse}`);
        }
        if (onion.message && onion.message.key) {
            //TODO - update
            let key = onion.message.key
            console.log(`[RESPONSE] reply onion for key: ${key}`)
            let decryptedData = cryptoApi.comm.decryptPayloadForKey(key, currentTransitCell.externalPayload)
            cryptoApi.logTimestamp(`[DECR]: ${decryptedData}`)
        }
    } catch (error) {
        console.log(error)
    }
})


router.get(`/publicKey`, async (req, res) => {
    res.status(200).json({
        publicKey: global.publicKeyString
    })
})
module.exports = router
