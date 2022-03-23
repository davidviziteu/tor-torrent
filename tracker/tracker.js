const express = require('express')
const bodyParser = require('body-parser')
const models = require('./models')
const router = require('express').Router()
const fs = require('fs')
const { StatusCodes } = require('http-status-codes')
console.log(`\n\n\n\n\n\n\n\n\n\n\n`);
let config
try {
    config = JSON.parse(process.argv[2].replaceAll(`'`, `"`))
} catch {
    config = {
        "ip": "localhost",
        "port": 6969
    }
}
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
let nodesMap = new Map()
let nodesArray = new Array()

router.post('/announce/node', (req, res) => {
    const { error, value } = models.trackerAnnounceSchema.validate(req.body);
    if (error)
        return res.status(StatusCodes.BAD_REQUEST).end(JSON.stringify({
            error: error
        }))
    if (req.isLocalIp)
        value.ip = `localhost`
    else
        value.ip = req.ip
    console.log(`new peer: ${value.ip}:${value.port}`) //ip ul il iei din req.ip nu din body
    nodesMap.set(`${value.ip}:${value.port}`, value) //change here from body
    return res.status(StatusCodes.OK).end(JSON.stringify({
        result: "ok",
        yourIp: value.ip
    }))
})

router.get('/scrape/nodes', (req, res) => {
    res.status(StatusCodes.OK).json({
        peersArray: [...nodesMap.values()]
    })
})

const getRandomKeyOfMap = map => [...map.keys()][Math.floor(Math.random() * map.size)]

router.get('/publickeyof/:ip/:port', (req, res) => {
    let node = nodesMap.get(`${req.params.ip}:${req.params.port}`)
    if (node)
        return res.status(200).json({
            publicKey: node.publicKey
        })
    return res.status(StatusCodes.NOT_FOUND).end()
})


router.get('/scrape/nodes/:count', (req, res) => {
    //the requester should ask a +1 node in case the list contains itself and the destinatary node
    console.log('scraping nodes count');
    let nodes = []
    if (nodesMap.size < req.params.count)
        return res.status(StatusCodes.PARTIAL_CONTENT).json({ nodes: nodesArray })

    let i = 0

    let usedIndexes = []
    let keysArray = [...nodesMap.keys()]
    let idx
    let randomKey
    let selectedNode
    while (i < req.params.count) {
        idx = randomNumber(nodesMap.size)
        randomKey = keysArray[idx]
        selectedNode = nodesMap.get(randomKey)
        if (usedIndexes.indexOf(idx) == -1) {
            usedIndexes.push(idx)
            nodes.push(selectedNode)
            i++
        }
    }

    res.status(StatusCodes.OK).json({
        nodes: nodes
    })
})

app.use('/', router)

app.listen(config.port, () =>
    console.log(`Listening on ${config.ip}:${config.port}...`)
)