const crypto = require("crypto");
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('cross-fetch');
const router = require('express').Router()
const fs = require('fs');
const config = JSON.parse(process.argv[2].replaceAll(`'`, `"`));
process.privateKey = config.privateKey
process.publicKey = config.publicKey
const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

router.post('/route', (req, res) => {

})

app.use('/', router)
app.listen(config.port, () =>
    console.log(`Listening on ${config.ip}:${config.port}...`)
)
console.log(config);
setTimeout(async () => {
    const response = await fetch('http://localhost:6969/announce/node',
        {
            headers: {
                "Content-Type": "application/json"
            },
            method: 'POST',
            body: JSON.stringify({
                ip: config.ip,
                port: config.port,
                publicKey: config.publicKey
            })
        });
    const data = await response.json();
} , 3000);