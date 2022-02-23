const crypto = require("crypto");
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('cross-fetch');
const router = require('express').Router()
const {testingRoutes} = require('./routes')
const fs = require('fs');
const { StatusCodes } = require('http-status-codes') 

let config = ''
try {
    config = JSON.parse(process.argv[2].replaceAll(`'`, `"`));
} catch {
    config.ip = 'localhost'
    config.port = 10000
    config.publicKey = 'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJBsTz2Rn4yR1GokFKmTC5n9YaiSMAVy+FItyTKdvMFmkXC1rU8hGc9TEF0h5C10bgEJw9Ihc62ay5frSxD+dc8CAwEAAQ=='
    config.privateKey = 'MIIBUwIBADANBgkqhkiG9w0BAQEFAASCAT0wggE5AgEAAkEAkGxPPZGfjJHUaiQUqZMLmf1hqJIwBXL4Ui3JMp28wWaRcLWtTyEZz1MQXSHkLXRuAQnD0iFzrZrLl+tLEP51zwIDAQABAkB3fiXR+zrXQ5FMgK3X4CIpNswmfU3eNFHhLKDbkEcsfEEO+58RyWN1E8PxkwUtR7Txx3FXErqJPaNtecxzeB2BAiEA08IlR0j8iLeFwk1EvbZOXlQCAv3hj1OihYMRfn1SWisCIQCumL/FNvnwNATvKQ+T/q3xyxyWTtRRTAg6ZWNO0XD07QIgantW+YiXDDyUs0bdiTQyJjbCKDT4BnV85PwqgNuN3K8CIGkDYsTBrk71WspmTgJbuk+mNMmLHFTRgFlvRe3QNzp5AiAw0FcmbBam9z3J+1T1cTvBeqGeR9840fQu1Y4Mlo2w9Q=='
}

const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

router.post('/route', (req, res) => {

})

app.use('/', router)
app.use('/testing', testingRoutes)
app.listen(config.port, () =>
    console.log(`Listening on ${config.ip}:${config.port}...`)
)

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
} , 1000);