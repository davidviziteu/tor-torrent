const express = require('express')
const bodyParser = require('body-parser')
const models = require('./models')
const router = require('express').Router()
const fs = require('fs')
const { StatusCodes } = require('http-status-codes') 

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


const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
let nodes = new Map()

router.post('/announce/node', (req, res) => {
    const { error, value } = models.trackerAnnounceSchema.validate(req.body);
    if (error) 
        return res.status(StatusCodes.BAD_REQUEST).end(JSON.stringify({
            error: error
        }))
    let newAnnounce = new models.Announce(value)
    console.log(`new peer ip: ${newAnnounce.ip}`)
    nodes.set(`${newAnnounce.ip}:${newAnnounce.port}`, newAnnounce)
    return res.status(StatusCodes.OK).end(JSON.stringify({
        result: "ok"
    }))
})

router.get('/scrape/nodes', (req, res) => {
    res.status(StatusCodes.OK).end(JSON.stringify(Object.fromEntries(nodes)))
})

app.use('/', router)

app.listen(config.port, () =>
    console.log(`Listening on ${config.ip}:${config.port}...`)
)