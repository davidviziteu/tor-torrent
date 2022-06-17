const express = require(`express`)
const bodyParser = require(`body-parser`)
const router = require(`express`).Router()
const fetch = require(`node-fetch`)
const fs = require(`fs`)
const { StatusCodes, ReasonPhrases, getReasonPhrase } = require(`http-status-codes`)
const trackerApi = require(`./utils/trackerApi`)
const cryptoApi = require(`./utils/cryptoApi`)
const models = require(`./models`)
require(`./utils/init`)
const app = express()
const procedures = require(`./utils/routines`)
const bencode = require(`bencode`)
const createTorrent = require('create-torrent')
const cors = require('cors');
const AppManager = require('./utils/appDataManager');

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use((req, res, next) => {
    if (req.socket.localAddress === res.socket.remoteAddress)
        req.isLocalIp = true
    next()
})
let id = 0
router.get('/echo', (req, res) => {
    console.log(`client on echo. ip: ${req.ip}`);
    return res.status(200).end(`client on echo. ip: ${req.ip}`)
})

router.post(`/load-torrent`, (req, res) => {
    const { metainfoPath, downloadPath } = req.body
    if (!metainfoPath || !downloadPath) return res.status(StatusCodes.BAD_REQUEST).end()
    //test if download path is a folder
    if (!fs.existsSync(downloadPath)) {
        console.log(`download path does not exist`);
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: `Path to save the torrent does not exist`,
        })
    }
    const file = fs.openSync(path, 'w');
    fs.access(metainfoPath, fs.constants.R_OK, (err) => {
        if (err) {
            console.log(err);
            console.log('error loading .torano file');
            return res.status(StatusCodes.BAD_REQUEST).end()
        }

        const torrent = bencode.decode(fs.readFileSync(metainfoPath));
        //validate

    })
})

router.get('/delete-torrent/:hash', (req, res) => {
    const { hash } = req.params
    AppManager.removeTorrent(hash)
    return res.status(StatusCodes.OK).end()
})

router.post(`/create-torrent`, (req, res) => {
    const { sourcePath, destPath } = req.body
    if (!sourcePath || !destPath) return res.status(StatusCodes.BAD_REQUEST).end({
        error: `sourcePath or destPath is missing`
    })
    //test if file exists
    fs.access(sourcePath, fs.constants.R_OK, (err) => {
        if (err) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: `file ${sourcePath} not found`
            })
        }
        createTorrent(sourcePath, {
            comment: 'torano',
            announceList: [[global.trackerAddress]],
        }, (err, torrent) => {
            if (err) {
                console.log(error);
                console.log(`error createTorrent module`);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    error: `error creating torrent: ${JSON.stringify(err)}`
                })
            }
            // `torrent` is a Buffer with the contents of the new .torrent file
            try {
                let exists = AppManager.createTorrent(sourcePath, torrent)
                if (exists == 'exists') {
                    fs.writeFile(destPath, torrent, (err) => {
                        if (err) {
                            console.log(error);
                            console.log(`error fs.writeFile(destPath, torrent`);
                            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                                error: `error writing file ${destPath}: ${JSON.stringify(err)}`
                            })
                        }
                    })
                }
            } catch (error) {
                console.log(error);
                console.log(`error appmanager create torrent`);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    error: `error creating torrent: ${JSON.stringify(error)}`
                })

            }
            return res.status(StatusCodes.OK).end()
        })

    })
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
        res.status(200).end(cryptoApi.encrpytTextRsa('ok', prevPubKey))
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
        let transitCell = new models.TransitCell()
        if (onion.onionLayer) { // return onion
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
        if (onion.message.startsWith(`key `)) {
            let key = onion.message.slice(4)
            console.log(`[RESPONSE] reponse onion for key: ${key}`)
            let decryptedData = cryptoApi.comm.decryptPayloadForKey(key, currentTransitCell.externalPayload)
            cryptoApi.logTimestamp(`[DECR]: ${decryptedData}`)
        }
    } catch (error) {
        console.log(error)
    }
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


router.get(`/publicKey`, async (req, res) => {
    res.status(200).json({
        publicKey: global.publicKeyString
    })
})

router.post('/override-tracker-url/', async (req, res) => {
    const { trackerurl } = req.body
    if (!trackerurl) return res.status(StatusCodes.BAD_REQUEST).json({ error: 'no tracker url provided' })
    global.trackerAddress = trackerurl
    res.status(200).end()
})

router.get('/exit', async (req, res) => {

    process.exit(0)
})

router.get('/load', async (req, res) => {
    const data = AppManager.loadProgress()
    //iterate values of data object
    let torrentsObject = {
    }
    for (let [key, value] of Object.entries(data.torrents)) {
        torrentsObject[key] = {
            hash: value.hash,
            completed: value.completed,
            piecesReceived: value.piecesReceived,
            requestesSend: value.requestesSend,
            parsedTorrent: {
                length: value.parsedTorrent.length,
                pieceLength: value.parsedTorrent.pieceLength,
                name: value.parsedTorrent.name,
            }
        }
    }
    return res.status(200).json({
        trackerAddress: data.trackerAddress,
        torrents: torrentsObject
    })
})

app.use(`/`, router)
try {
    app.listen(config.port, () =>
        console.log(`Listening on ${config.ip}:${config.port}...`)
    )
} catch (error) {
    if (error.code === 'EADDRINUSE')
        console.log('Port is already in use, probably debugging.');
    else
        console.log(error);

}

if (global.dev) {
    console.log(`dev mode enabled, tracker addr localhost`);
    global.trackerAddress = 'http://localhost:6969'
}


// if (require.main === module) {
//     if (global.dev) {
//         console.log(`dev mode enabled, tracker addr localhost`);
//         global.trackerAddress = 'http://localhost:6969'
//         setTimeout(async () => {
//             await procedures.startRefreshingLoop()
//             let hops = await trackerApi.fetchHops()
//             console.log(hops);
//         }, 1000)
//     }
// }

module.exports = {
    appServer: app,
    startRefreshingLoop: procedures.startRefreshingLoop,
}

