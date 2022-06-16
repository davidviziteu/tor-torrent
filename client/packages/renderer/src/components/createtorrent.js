const createTorrent = require('create-torrent')


function createTorrentPromise(filePath) {
    return new Promise((resolve, reject) => {
        createTorrent(filePath, (err, torrent) => {
            if (err) {
                reject(err)
            } else {
                resolve(torrent)
            }
        })
    })
}
export default createTorrentPromise