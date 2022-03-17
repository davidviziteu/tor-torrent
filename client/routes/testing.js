const router = require('express').Router()
const fetch = require('node-fetch');
const crypto = require("crypto");
const utils = require('../utils')

router.post('/sendmessage', async (req, res) => {
    /*
    body: arrays of keys and ips/ports for routing
    message: text for now
    */
    console.log(global.config.privateKey)
})

//probably useful in production as well
router.post('/testNode', async (req, res) => {
    //sends an onion to a node. the respective node should forward the onion back
})


module.exports = router