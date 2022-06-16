const fs = require('fs')
const parseTorrent = require('parse-torrent')

let downloaderInstance = null
let progressLoaded = false
class AppManager {
    constructor() {
        this.data = {
            trackerAddress: null,
            torrents: {}
        };
    }

    setTrackerAddress(trackerAddress) {
        global.trackerAddress = trackerAddress;
        data.trackerAddress = trackerAddress;
        return this
    }

    addTorrent(filesPath, metainfoPath, isFolder = false) {
        let metainfoContent, parsedTorrent
        try {
            metainfoContent = fs.readFileSync(metainfoPath)
        } catch (error) {
            console.log(error);
            console.log('Error reading metainfo file. path: ' + metainfoPath);
            throw ('Error reading metainfo file');
        }

        try {
            parsedTorrent = parseTorrent(metainfoContent)
        } catch (error) {
            console.log(error);
            console.log('Error parsing metainfo file. path: ' + metainfoPath);
            throw ('Error parsing metainfo file');
        }


        if (this.data.torrents[parsedTorrent.infoHash]) {
            throw 'info hash already exists';
        }

        try {
            let metainfoFileName = metainfoPath.split('/').pop();
            let metainfoFilePath = `./${metainfoFileName}`;
            fs.writeFileSync(metainfoFilePath, metainfoFile);

            data.torrents[hash] = {
                hash: hash,
                filesPath: filesPath,
                metainfoFileName: metainfoFileName,
                parsedTorrent: parsedTorrent,
                isFolder: isFolder,
                completed: false,
                piecesRequested: new Array(parsedTorrent.pieces.length).fill(false),
                piecesRecieved: new Array(parsedTorrent.pieces.length).fill(false)
            }
            //TODO begin announce procedures and download
            return true;
        } catch (error) {
            console.log(error);
            console.log('error adding torrent');
            return false;
        }
    }
    //todo
    createTorrent(filesPath, parsedTorrent, isFolder = false) {

        if (this.data.torrents[parsedTorrent.infoHash]) {
            throw 'info hash already exists';
        }

        try {
            //copy metainfo file to "."
            let metainfoFilePath = `./${parsedTorrent.infoHash}`;
            fs.writeFileSync(metainfoFilePath, metainfoFile);

            data.torrents[hash] = {
                infoHash: infoHash,
                filesPath: filesPath,
                metainfoFileName: infoHash,
                parsedTorrent: parsedTorrent,
                isFolder: isFolder,
                completed: true
            }
            //begin announce procedures
            return true;
        } catch (error) {
            console.log(error);
            console.log('error adding torrent');
            return false;
        }
    }

    getTorrents() {
        return data.torrents;
    }

    getTorrent(hash) {
        return data.torrents[hash]
    }

    removeTorrent(hash) {
        let targetTorrent = this.getTorrent(hash);
        if (targetTorrent) {
            fs.unlinkSync(`./${targetTorrent.metainfoFileName}`);
            delete data.torrents[hash];
        }
    }

    saveProgress() {
        fs.writeFileSync(`./.data${global.port}.json`, JSON.stringify(this.data));
    }

    loadProgress() {
        if (progressLoaded)
            return this.data
        try {
            if (fs.existsSync(`./.data${global.port}.json`)) {
                this.data = JSON.parse(fs.readFileSync(`./.data${global.port}.json`));
            }
            return this.data
        } catch (error) {
            console.log(error);
            console.log('Error loading data_port_.json');
        }
    }

}


function getInstance() {
    if (downloaderInstance === null) {
        downloaderInstance = new AppManager();
    }
    return downloaderInstance;
}

module.exports = getInstance();