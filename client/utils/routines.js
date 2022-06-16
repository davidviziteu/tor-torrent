const crypto = require("crypto");
const fetch = require('node-fetch');
const EventEmitter = require('node:events');
const myEmitter = new EventEmitter();
const { announceAsNode, getTrackerPublicKey } = require('./trackerApi')
const utils = require(`./cryptoApi`)
const AppManager = require('./appDataManager');

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
        global.publicKey = publicKey
        global.privateKey = privateKey
        global.publicKeyString = publicKey.export({
            format: `pem`,
            type: `spki`
        })
        console.log('own public key refreshed');
    } catch (error) {
        console.log(error);
        console.log('error when generating keys');
        throw ('error when generating keys');
    }
}


const refreshProcedure = async () => {
    try {
        await getTrackerPublicKey()
        await refreshOwnPbKey()
        await announceAsNode()
        myEmitter.emit('tracker key refreshed')
    } catch (error) {
        console.log('^ error at refreshProcedure');
        throw error
    }
}
//poate poti sa dai emitter ul ca param
exports.startRefreshingLoop = async () => {
    try {
        AppManager.saveProgress()
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
    } catch (error) {
        console.log('error at startRefreshingLoop');
        throw error
    }
}


setInterval(() => {
    AppManager.saveProgress()
}, 1000 * 60);