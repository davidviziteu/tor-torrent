const comm = require('./comm')
const models = require('../models')
const cryptoApi = require('./cryptoApi')

exports.buildRequestPiecesMsg = (piecesArr) => {
    return JSON.stringify({
        requestPieces: piecesArr
    })
}

exports.sendROPieceRequest = async (piecesArr, ro, to) => {
    let transitCell = new models.TransitCell()
    let message = {
        requestPieces: piecesArr,
        replyOnion: ro
    }

    transitCell.externalPayload = cryptoApi.encrpytTextAes(JSON.stringify(message), to.encryptExternalPayload)
    transitCell.onion = to.onion
    transitCell.encryptedAesKey = to.encryptedAesKey
    try {
        let nextNodeResponse = await comm.sendOnion(to.ip, to.port, transitCell)
        console.log(`reponse: ${nextNodeResponse}`);
    } catch (error) {
        console.log(error);
        console.log(`failed to send onion to ${to.ip}:${to.port}`);
    }

}