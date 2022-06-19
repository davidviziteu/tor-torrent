const comm = require('./comm')
const models = require('../models')
const cryptoApi = require('./cryptoApi')
const statsManager = require('./appStatsManager')

//pc arr, reply onion, to (onion)
exports.sendPiecesRequest = async (piecesArr, ro, to) => {
    let transitCell = new models.TransitCell()
    let message = {
        requestPieces: piecesArr,
        replyOnion: ro
    }
    try {
        transitCell.externalPayload = cryptoApi.encrpytTextAes(JSON.stringify(message), to.encryptExternalPayload)
    } catch (error) {
        console.log(`failed to encrypt message for pieces request`);
        return
    }
    transitCell.onion = to.onion
    transitCell.encryptedAesKey = to.encryptedAesKey
    try {
        let nextNodeResponse = await comm.sendOnion(to.ip, to.port, transitCell)
        console.log(`reponse: ${nextNodeResponse}`);
        statsManager.incrementMessagesSent();
    } catch (error) {
        console.log(error);
        console.log(`failed to send onion to ${to.ip}:${to.port}`);
    }
}

exports.sendPieces = async (piecesArr, to) => {
    let transitCell = new models.TransitCell()
    let message = JSON.stringify({
        pieces: piecesArr
    })

    try {
        transitCell.externalPayload = cryptoApi.encrpytTextAes(JSON.stringify(message), to.encryptExternalPayload)
    } catch (error) {
        console.log(`failed to encrypt message for pieces upload`);
        return
    }
    transitCell.onion = to.onion
    transitCell.encryptedAesKey = to.encryptedAesKey
    try {
        await comm.sendOnion(to.ip, to.port, transitCell)
        for (let index = 0; index < piecesArr.length; index++)
            if (piecesArr[index])
                statsManager.incrementPiecesUploaded();
        statsManager.incrementMessagesSent();
    } catch (error) {
        console.log(`failed to upload pieces to next: ${to.ip}:${to.port}`);
    }

}