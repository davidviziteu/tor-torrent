const crypto = require("crypto");
const fetch = require('node-fetch');
const EventEmitter = require('node:events');
const myEmitter = new EventEmitter();
const { announceAsNode, getTrackerPublicKey } = require('../trackerAPI')
const utils = require(`../utils`)

const getRefreshPeriod = async () => {
    if (!trackerAddress) {
        console.log(`trackerAddress is not defined`)
        process.exit(1)
    }
    try {
        aesKey = utils.generateAesKey()
        const r = await fetch(global.trackerAddress + `/session`,
            {
                headers: { "Content-Type": "application/json" },
                method: `POST`,
                body: JSON.stringify({
                    encryptedKey: utils.encrpytTextRsa(aesKey, global.trackerPbKey),
                })
            })
        const response = await (r).json()

        if (!response.encryptedData || response.error) {
            console.log(`error tracker didnt return refresh period`);
            console.log(`error: ${response.error}`);
            throw `error tracker didnt return refresh period`
        }
        return JSON.parse(utils.decryptTextAes(response.encryptedData, aesKey))
    } catch (error) {
        console.error(error)
        console.log(`error at fetching refresh period from tracker`);
    }
}

const refreshOwnPbKey = async () => {
    if (!trackerAddress) {
        console.log(`trackerAddress is not defined`)
        process.exit(1)
    }
    try {
        const { publicKey, privateKey } = crypto.generateKeyPairSync(`rsa`, {
            modulusLength: configurations.modulusLength ? configurations.modulusLength : 2048,
        })
        global.publicKey = publicKey
        global.privateKey = privateKey
        global.publicKeyString = publicKey.export({
            format: `pem`,
            type: `spki`
        })
        console.log('own public key refreshed');
    } catch (error) {
        console.log(error);
        console.log('error when generating keys, exiting..');
        process.exit(1);
    }
}


const refreshProcedure = async () => {
    try {
        await getTrackerPublicKey()
        await refreshOwnPbKey()
        await announceAsNode()
        myEmitter.emit('tracker key refreshed')
    } catch (error) {
        console.log(error);
        console.log('error when refreshing keys, exiting..');
        process.exit(1);
    }
}
//poate poti sa dai emitter ul ca param
exports.startRefreshingLoop = async () => {
    await refreshProcedure()
    let refreshObject = await getRefreshPeriod()
    console.log(`tracker session time: ${refreshObject.refreshPeriodMs / 60000} minutes`);
    if (refreshObject.timeLeftMs < 3000) {
        await utils.sleep(refreshObject.timeLeftMs + 100)
        refreshObject = await getRefreshPeriod()
    }
    console.log(`refreshing every ${refreshObject.refreshPeriodMs / 60000} minutes in ${refreshObject.timeLeftMs} ms`);
    setTimeout(async () => {
        await refreshProcedure()
        console.log('refresh');
        myEmitter.emit('refreshed')
        setInterval(async () => {
            await refreshProcedure()
            console.log('refresh');
            myEmitter.emit('refreshed')
        }, refreshObject.refreshPeriodMs)
    }, refreshObject.timeLeftMs + 10)
}