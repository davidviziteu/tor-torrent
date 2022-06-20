//torrent manager
const fs = require('fs')
const comm = require('./comm')
const trackerApi = require('./trackerApi')
const statsManager = require('./appStatsManager')
const utils = require('./utils')
const peerMessages = require('./peerMessages')
const sha1 = require('simple-sha1')
let inst = null

function _getIndexesOfNotReceivedPieces(piecesReceived) {
    let indexes = []
    for (let i = 0; i < piecesReceived.length; i++) {
        if (!piecesReceived[i]) {
            indexes.push(i)
        }
    }
    return indexes
}

class TorrentManager {
    constructor() {
        this.appManager
        this.intervalId = null
    }

    _isLastPiece(pieceIndex, parsedTorrent) {
        return pieceIndex === parsedTorrent.pieces.length - 1
    }

    setAppManager(appManager) {
        this.appManager = appManager
    }


    async loopingFunction() {
        let toScrape = this.appManager.getIncompleteTorrentsHashes()

        if (toScrape.length <= 0) {
            console.log('all torrents downloaded');
            if (this.intervalId) {
                clearInterval(this.intervalId)
                this.intervalId = null
            }
            return
        }

        let leechers = await trackerApi.getLeechers(toScrape)
        let availableRelayNodes = await trackerApi.fetchHops()
        if (!availableRelayNodes) {
            console.log('no relay nodes available, trying again later');
            return
        }
        statsManager.setRelayNodesCount(availableRelayNodes.length)

        if (availableRelayNodes.length <= 1) {
            console.log('not enough relay nodes available at this time. trying again later');
            return
        }
        for (let index = 0; index < toScrape.length; index++) {

            const infoHash = toScrape[index];
            const replyOnionsArr = leechers[infoHash]
            if (!replyOnionsArr || replyOnionsArr.length <= 0) {
                console.log('no leechers found at the moment for ' + infoHash);
                continue
            }
            const torrentObject = this.appManager.getTorrent(infoHash)
            if (!torrentObject || torrentObject.completed) continue
            // torrentObject.piecesRequested
            let unrecvPieces = _getIndexesOfNotReceivedPieces(torrentObject.piecesReceived)

            for (let i = 0; i < replyOnionsArr.length; i++) {
                if (unrecvPieces.length <= 0)
                    continue
                let requestPieces = utils.randomOfArray(unrecvPieces, global.maxPiecesPerMessage)

                let ROforSeeder = comm.prepReplyOnion(
                    utils.randomOfArrayExtend(availableRelayNodes, global.maxRelayNodesPerMessage),
                    infoHash,
                    'pieces', //message for me
                    false,
                );
                peerMessages.sendPiecesRequest(requestPieces, ROforSeeder, replyOnionsArr[i])
            }
        }

    }

    //{ "hash": [replyOnion, ....] }
    async askForPieces(leechersList) {
        if (!leechersList)
            return

    }

    async startDownloading(initialLeechersList) {
        if (initialLeechersList)
            this.askForPieces(initialLeechersList)
        else
            this.loopingFunction()

        if (!this.intervalId)
            this.intervalId = setInterval(() => {
                getInstance().loopingFunction()
            }, 8000); //8 seconds to not uselessly overload the network
        return this.intervalId
    }

    async handlePiecesRequest(message, infoHash) {
        try {
            message = JSON.parse(message)
        } catch (error) {
            throw 'invalid json content message on piece request'
        }

        const { requestPieces, replyOnion } = message
        console.log(`received pieces request for ${infoHash}`);
        const torrentObject = this.appManager.getTorrent(infoHash)
        let pieces = [] //{piece index, piece }
        if (!torrentObject) throw 'piece request for unknown torrent' //handled in catch of calling fn

        let _min = Math.min(requestPieces.length, global.maxPiecesPerMessage)
        let pieceLen = torrentObject.parsedTorrent.pieceLength
        for (let i = 0; i < _min; i++) {
            let pieceIndex = requestPieces[i]
            if (torrentObject.completed || torrentObject.piecesReceived[pieceIndex]) {
                try {
                    let isLastPiece = this._isLastPiece(pieceIndex, torrentObject.parsedTorrent)
                    let buf = Buffer.alloc(isLastPiece ? torrentObject.parsedTorrent.lastPieceLength : pieceLen)
                    fs.readSync(torrentObject.fd, buf, 0,
                        isLastPiece ? torrentObject.parsedTorrent.lastPieceLength : pieceLen,
                        pieceIndex * pieceLen)
                    pieces.push({
                        pieceIndex: pieceIndex,
                        piece: buf.toString('hex')
                    })
                } catch (error) {
                    console.log(error);
                    console.log(`error reading piece`);
                    continue
                }
            }
        }
        peerMessages.sendPieces(pieces, replyOnion)
    }


    async handlePiecesDownload(message, infoHash) {
        let parsedMessage
        try {
            parsedMessage = JSON.parse(JSON.parse(message))
        } catch (error) {
            throw 'invalid json content message on piece download'
        }
        const { pieces } = parsedMessage
        const torrentObject = this.appManager.getTorrent(infoHash)
        if (!torrentObject) throw 'piece provided for unknown torrent' //handled in catch of calling fn
        for (let i = 0; i < pieces.length; i++) {
            const { pieceIndex, piece } = pieces[i]
            if (torrentObject.completed || torrentObject.piecesReceived[pieceIndex])
                continue
            try {
                let buf = Buffer.from(piece, 'hex')
                let pieceSha1 = sha1.sync(buf)
                if (pieceSha1 !== torrentObject.parsedTorrent.pieces[pieceIndex]) {
                    console.log(`piece ${pieceIndex} sha1 mismatch`);
                    continue
                }
                fs.writeSync(torrentObject.fd, buf, 0, buf.length, pieceIndex * torrentObject.parsedTorrent.pieceLength)
                this.appManager.setPieceRecvd(infoHash, pieceIndex)
            } catch (error) {
                console.log(`error writing piece`);
                continue
            }
        }

    }



}

function getInstance() {
    if (inst === null) {
        inst = new TorrentManager();
    }
    return inst;
}
module.exports = getInstance();