const router = require('express').Router()
const fetch = require('cross-fetch');
const crypto = require("crypto");

router.get('/peers', async (req, res) => {
    const response = await fetch('http://localhost:6969/scrape/nodes');
    const data = await response.json();
    console.log(data);
    return res.status(200).end(JSON.stringify(
        data
    ))
})


const prepOnion = (hops, data)

router.post('/sendmessage', async (req, res) => {
    /*
    body: arrays of keys and ips/ports for routing
    message: text for now
    */
})



module.exports = router