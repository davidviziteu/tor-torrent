//torrent manager
const fs = require('fs')
const comm = require('./comm')
const trackerApi = require('./trackerApi')
const statsManager = require('./appStatsManager')
const utils = require('./utils')
const peerMessages = require('./peerMessages')
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

        this.intervalId = setInterval(() => {
            getInstance().loopingFunction()
        }, 10000);
        return this.intervalId
    }

}


function getInstance() {
    if (inst === null) {
        inst = new TorrentManager();
    }
    return inst;
}

module.exports = getInstance();