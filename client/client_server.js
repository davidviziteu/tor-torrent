const crypto = require(`crypto`)
const express = require(`express`)
const bodyParser = require(`body-parser`)
const fetch = require(`node-fetch`)
const router = require(`express`).Router()
const { testingRoutes } = require(`./routes`)
const fs = require(`fs`)
const { StatusCodes, ReasonPhrases, getReasonPhrase } = require(`http-status-codes`)
const utils = require(`./utils`)
const models = require(`./models`)
const { exit } = require("process")
const app = express()
let config = {}
console.log(`\n\n\n\n\n\n\n\n\n\n\n`);
try {
    config = JSON.parse(process.argv[2].replaceAll(`'`, `"`))
} catch {
    config.ip = `localhost`
    config.port = 10000
}
const modulusLength = 1024 * 2
const { publicKey, privateKey } = crypto.generateKeyPairSync(`rsa`, {
    modulusLength: modulusLength,
})

const { publicKeyPayload, privateKeyPayload } = crypto.generateKeyPairSync(`rsa`, {
    modulusLength: modulusLength,
})

global.publicKey = publicKey
global.privateKey = privateKey
global.privateKeyString = privateKey.export({
    format: `pem`,
    type: `pkcs1`
})
global.publicKeyString = publicKey.export({
    format: `pem`,
    type: `spki`
})
global.publicKeyPayloadString = publicKey.export({
    format: `pem`,
    type: `spki`
})
global.privateKeyPayload = privateKeyPayload
console.log(`generated public private key pair`)

global.config = config
console.log(`public key: ` + global.publicKeyString)



app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
let id = 0
router.post(`/route`, async function routeOnion(req, res) {
    console.log(`/route`);
    //req body of shape json(transit cell)
    try {
        let currentId = ++id
        console.log(`req.body`)
        console.log(req.body)
        let cell = req.body
        let aesKey
        let foundKey = false
        try {
            console.log(`attempting decrypt`);
            if (cell.encryptedAesKey == '') {
                console.log(`cell.encryptedAesKey too small ${cell.encryptedAesKey}`);
                return res.status(StatusCodes.BAD_REQUEST).end()
            }
            aesKey = utils.decrpytTextRsa(cell.encryptedAesKey)
            foundKey = true
        } catch (error) {
            // dev. remove this whole block later
            console.log(`trying keys`);
            let allPeers = await fetch('http://localhost:6969/scrape/nodes')
            if (allPeers.status != 200) {
                return res.status(StatusCodes.EXPECTATION_FAILED).end(`tracker fetch failed ith status ${allPeers.status}`)
            }
            allPeers = await allPeers.json()
            allPeers.peersArray.forEach(peer => {
                if (peer.publicKey == cell.aesPublicKey) {
                    console.log(`the cell was encrypted with pb key of ${peer.port}`);
                }
            });
            console.log(`end of public key search`);
            allPeers.peersArray.forEach(peer => {
                try {
                    aesKey = utils.decrpytTextRsa(peer.privateKey)
                    console.log(`private key of peer ${peer.port}`);
                    foundKey = true
                } catch (error) {
                    console.log(`NOT  ${peer.port}`);
                }
            });
        }
        if (!foundKey) { //dev
            console.log(`key not found`);
            throw ''
        }
        let onion = JSON.parse(utils.decryptTextAes(req.body.onion, aesKey))
        //validate onion, if not ok send bad request status code (1)
        console.log(`rey.body decrypted onion layer`);
        console.log(onion);
        if (onion.message == `fwd`) {
            if (onion.encryptExternalPayload)
                extPayload = utils.encrpytTextRsa(extPayload, onion.encryptExternalPayload)
            let transitCell = new models.TransitCell()
            transitCell.externalPayload = req.body.externalPayload
            transitCell.onion = onion.onionLayer
            transitCell.encryptedAesKey = onion.next.encryptedAesKey
            console.log(`[${config.port}][id: ${currentId}] got onion to fwd to ${onion.next.ip}:${onion.next.port}`)
            let nextPeerReponse = await utils.properFetchPost(`http://[${onion.next.ip}]:${onion.next.port}/route`, transitCell)
            //if timing ok
            console.log(`[${config.port}][id: ${currentId}] onion fwd reponse status: ${nextPeerReponse.status}`)
            switch (nextPeerReponse.status) {
                case StatusCodes.OK:
                case StatusCodes.BAD_REQUEST:
                case StatusCodes.REQUEST_TIMEOUT:
                    return res.status(nextPeerReponse.status).end()
                default:
                    return res.status(StatusCodes.REQUEST_TIMEOUT).end() //mark node as `out` 
            }
        }
        //onion for me
        console.log(onion.message);
        res.status(200).end()
    } catch (error) {
        //Error: error:04099079:rsa routines:RSA_padding_check_PKCS1_OAEP_mgf1:oaep decoding error
        //  code: 'ERR_OSSL_RSA_OAEP_DECODING_ERROR'
        //inseamna ca am dat decode la ceva ce a fost criptat cu alta cheie
        console.log(error)
        return res.status(StatusCodes.BAD_REQUEST).end(ReasonPhrases.BAD_REQUEST)
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
    let data = req.body //trb dest ip si dest port, hopsNumber, message si payload
    const response = await fetch(`http://localhost:6969/scrape/nodes/${data.hopsNumber}`) // cred ca ar trebui facut la tracker endpoint sa dea n ips random
    const responsePbKey = await fetch(`http://localhost:6969/publickeyof/${data.destip}/${data.destport}`) // cred ca ar trebui facut la tracker endpoint sa dea n ips random
    if (responsePbKey.status != 200)
        return res.status(StatusCodes.EXPECTATION_FAILED).json({
            error: `tracker fetch public key of node failed. status ${responsePbKey.status}`
        })
    let responseJson = await responsePbKey.json()
    data.publicKey = responseJson.publicKey
    if (response.status != 200)
        return res.status(StatusCodes.EXPECTATION_FAILED).json({
            error: `tracker status ${response.status}`
        })
    let hops = (await response.json())
    console.log(hops);
    let { transitCell, nextIp, nextPort } = utils.prepTransitCell(hops.nodes, data.destip, data.destport, responseJson.publicKey, data.message, data.payload)
    let peerFetchRes = await utils.properFetchPost(`http://[${nextIp}]:${nextPort}/route`, transitCell)
    return res.status(peerFetchRes.status).end(
        getReasonPhrase(peerFetchRes.status)
    )
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

setTimeout(async () => {
    try {
        const response = await fetch(`http://localhost:6969/announce/node`,
            {
                headers: {
                    "Content-Type": "application/json"
                },
                method: `POST`,
                body: JSON.stringify({
                    port: config.port,
                    publicKey: global.publicKeyString,
                    privateKey: global.privateKeyString
                })
            })
        if (response.status != 200) {
            console.log(await response.text());
            let json = await response.json()
            throw json.error
        }
        console.log(`announce ok`);
    } catch (error) {
        console.error(error)
        console.log(`error at announce`);
    }
}, 1000)