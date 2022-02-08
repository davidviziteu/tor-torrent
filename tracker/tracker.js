const express = require('express')
const bodyParser = require('body-parser')
// const router = require('./routes')
const router = require('express').Router()
const fs = require('fs');
const config = JSON.parse(process.argv[2].replaceAll(`'`, `"`));

const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
let nodes = new Map()


router.post('/announce', (req, res) => {
    if (!req.body.ip) //schimbi cu validate
        return res.status(400).end('no body')
    let newAnnounce = {
        ip: req.body.ip,
        publicKey: req.body.publicKey,
        port: req.body.port
    };
    console.log(`new peer ip: ${newAnnounce.ip}`);
    nodes.set(`${newAnnounce.ip}:${newAnnounce.port}`, newAnnounce)
    return res.status(200).end('ok');
})

router.get('/scrape/peers', (req, res) => {
    res.end(JSON.stringify(Object.fromEntries(nodes)));
})

router.post('/route', (req, res) => {

})

app.use('/', router)
app.listen(config.port, () =>
    console.log(`Listening on ${config.ip}:${config.port}...`)
)