const router = require(`express`).Router()
const models = require(`../models`)
const cryptoApi = require(`../utils/cryptoApi`)
const { StatusCodes } = require('http-status-codes')
const statsManager = require('../utils/appStatsManager')
const comm = require('../utils/comm')
const utils = require('../utils/utils')
const torrentsManager = require('../utils/toranosManager')

let id = 0
router.post(`/relay`, async function routeOnion(req, res) {
    console.log(`/relay`);
    let onion
    let currentTransitCell
    let aesKey
    let currentId = ++id
    let prevPubKey
    try {
        prevPubKey = await comm.getPublicKey(req.ip, req.body.requesterPort)
    } catch (error) {
        statsManager.incrementOnionDiscarded()
        console.log(error)
        console.log(`cannot fetch prev node's publickey`)
        res.status(StatusCodes.BAD_REQUEST).end(`cannot fetch prev node's publickey`)
        return
    }
    try {
        currentTransitCell = req.body
        aesKey = cryptoApi.decrpytTextRsa(currentTransitCell.encryptedAesKey)
    } catch (error) {
        statsManager.incrementOnionDiscarded()
        // console.log(error)
        // console.log(`error while decryptiong aes key`)
        console.log(`onion discarded`);
        return res.status(200).end(cryptoApi.encrpytTextRsa(`failed ${utils.randomStringPadding()}`, prevPubKey))
    }
    try {
        onion = JSON.parse(cryptoApi.decryptTextAes(req.body.onion, aesKey))
        if (!onion.message) { //means its onion to be forwarded
            if (onion.encryptExternalPayload) {
                utils.logTimestamp(`return msg`)
                currentTransitCell.externalPayload = cryptoApi.encrpytTextAes(currentTransitCell.externalPayload, onion.encryptExternalPayload)
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
            let response = await comm.sendOnion(onion.next.ip, onion.next.port, transitCell)
            console.log(`[${config.port}][id: ${currentId}] onion fwd reponse message: ${response}`)
            statsManager.incrementOnionRelayed()
            return res.status(200).end(cryptoApi.encrpytTextRsa(response, prevPubKey))
        }
        //onion for me
        res.status(200).end(cryptoApi.encrpytTextRsa(`ack ${utils.randomStringPadding()}`, prevPubKey))
    } catch (error) {
        // statsManager.incrementOnionDiscarded()
        // console.log(error)
        console.log(`onion discarded`);
        return res.status(200).end(cryptoApi.encrpytTextRsa(`failed ${utils.randomStringPadding()}`, prevPubKey))
    }
    try {
        if (onion.message && onion.message.key) {
            let key = onion.message.key
            console.log(`[RESPONSE] reply onion for key: ${key}`)
            let decryptedData = comm.decryptPayloadForKey(key, currentTransitCell.externalPayload)
            // utils.logTimestamp(`[PAYLOAD]: ${decryptedData}`)

            switch (onion.message.type) {
                case 'upload':
                    torrentsManager.handlePiecesRequest(decryptedData, onion.message.infoHash)
                    console.log('pieces uploaded');
                    statsManager.incrementMessagesResponses()
                    break
                case 'pieces':
                    torrentsManager.handlePiecesDownload(decryptedData, onion.message.infoHash)
                    console.log('pieces received');
                    statsManager.incrementMessagesResponses()
                    break
                default:
                    console.log(`onion message type not recognized: ${onion.message.type}`);
                    statsManager.incrementOnionDiscarded()
            }
        }
    } catch (error) {
        statsManager.incrementOnionDiscarded()
        // console.log(error)
        console.log(`onion discarded`);
    }
})


router.get(`/publicKey`, async (req, res) => {
    res.status(200).json({
        publicKey: global.publicKeyString
    })
})
module.exports = router
