const crypto = require("crypto");
const fetch = require('node-fetch');
const { eventEmitter, trackerRefreshSessionEv } = require('./eventsManager')
const { announceAsNode, getTrackerPublicKey } = require('./trackerApi')
const utils = require(`./cryptoApi`)


const getRefreshPeriod = async () => {
    if (!trackerAddress || !global.trackerPbKey) {
        console.log(`trackerAddress or pb key is not defined. cannot get refresh period`)
        throw (`trackerAddress or pb key is not defined. cannot get refresh period`)
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
        console.log(error)
        console.log(`error at fetching refresh period from tracker`);
        throw (`error at fetching refresh period from tracker`);
    }
}

const refreshOwnPbKey = async () => {
    try {
        const { publicKey, privateKey } = crypto.generateKeyPairSync(`rsa`, {
            modulusLength: configurations.modulusLength ? configurations.modulusLength : 2048,
        })
        global.myReplyOnionsKeys = []
        global.publicKey = publicKey
        global.privateKey = privateKey
        global.publicKeyString = publicKey.export({
            format: `pem`,
            type: `spki`
        })
        console.log('own public key refreshed');
        global.keysError = null
    } catch (error) {
        console.log(error);
        console.log('error when generating keys');
        throw 'keys generation error'
    }
}

let refreshIntervalId = null;
let timeoutId = null;

const refreshProcedure = async () => {
    try {
        await getTrackerPublicKey()
        await refreshOwnPbKey()
        await announceAsNode()
        eventEmitter.emit(trackerRefreshSessionEv)
    } catch (error) {
        if (error == 'keys generation error') {
            global.keysError = 'unable to generate public own key...'
        }
        global.refreshLoopStarted = false
        console.log('^ error at refreshProcedure');
        console.log(' cleared interval');
        clearInterval(refreshIntervalId)
        clearTimeout(timeoutId)
    }
}
//poate poti sa dai emitter ul ca param
exports.startRefreshingLoop = async () => {
    if (global.refreshLoopStarted) {
        return;
    }
    global.refreshLoopStarted = true
    try {
        await refreshProcedure()
        let refreshObject = await getRefreshPeriod()
        console.log(`tracker session time: ${refreshObject.refreshPeriodMs / 60000} minutes`);
        if (refreshObject.timeLeftMs < 3000) {
            await utils.sleep(refreshObject.timeLeftMs + 100)
            refreshObject = await getRefreshPeriod()
        }
        console.log(`refreshing every ${refreshObject.refreshPeriodMs / 60000} minutes in ${refreshObject.timeLeftMs} ms`);
        timeoutId = setTimeout(async () => {
            await refreshProcedure()
            console.log('refresh');
            refreshIntervalId = setInterval(async () => {
                await refreshProcedure()
                console.log('refresh');
            }, refreshObject.refreshPeriodMs)
        }, refreshObject.timeLeftMs + 10)
    } catch (error) {
        global.refreshLoopStarted = false
        console.log('error at startRefreshingLoop');
        clearInterval(refreshIntervalId)
        clearTimeout(timeoutId)
    }
}


