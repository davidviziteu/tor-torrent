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
            this.data.trackerAddress = parsedTorrent.announce[0]
        } catch (error) {
            console.log(error);
            console.log('Error parsing metainfo file. path: ' + metainfoPath);
            throw ('Error parsing metainfo file');
        }


        if (this.data.torrents[parsedTorrent.infoHash]) {
            throw 'info hash already exists';
        }

        try {
            let metainfoFilePath = `./.toranofiles/${parsedTorrent.infoHash}`;
            fs.writeFileSync(metainfoFilePath, metainfoFile);
            let preq = []
            let precv = []
            for (let i = 0; i < parsedTorrent.files.length; i++) {
                preq.push(0)
                precv.push(0)
            }
            data.torrents[hash] = {
                hash: hash,
                filesPath: filesPath,
                metainfoFilePath: metainfoFilePath,
                parsedTorrent: parsedTorrent,
                isFolder: isFolder,
                completed: false,
                piecesRequested: preq,
                piecesRecieved: precv,
                requestesSend: 0
            }
            //TODO begin announce procedures and download
            this.saveProgress()
            return true;
        } catch (error) {
            console.log(error);
            console.log('error adding torrent');
            return false;
        }
    }
    //todo
    createTorrent(filesPath, rawTorrent, isFolder = false) {
        let parsedTorrent = parseTorrent(rawTorrent)
        if (this.data.torrents[parsedTorrent.infoHash]) {
            console.log(`info hash for torrent ${parsedTorrent.name} already exists`);
            return 'exists'
        }
        this.data.trackerAddress = parsedTorrent.announce[0]
        try {
            //copy metainfo file to "."
            let metainfoFilePath = `./.toranofiles/${parsedTorrent.infoHash}`;
            fs.writeFileSync(metainfoFilePath, rawTorrent);

            this.data.torrents[parsedTorrent.infoHash] = {
                infoHash: parsedTorrent.infoHash,
                filesPath: filesPath,
                metainfoFilePath: metainfoFilePath,
                parsedTorrent: parsedTorrent,
                isFolder: isFolder,
                completed: true,
                requestesSend: 0
            }
            //begin announce procedures
            console.log(`created torrent ${parsedTorrent.name}`);
            this.saveProgress()
            return undefined;
        } catch (error) {
            console.log(error);
            console.log('error adding torrent');
            throw error;
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
            fs.unlinkSync(`./${targetTorrent.metainfoFilePath}`);
            delete data.torrents[hash];
        }
    }

    saveProgress() {
        fs.writeFileSync(`./.data${global.port}.json`, JSON.stringify(this.data));
        console.log('app manager: saved data');
    }

    loadProgress() {
        if (progressLoaded)
            return this.data
        try {
            if (fs.existsSync(`./.data${global.port}.json`)) {
                this.data = JSON.parse(fs.readFileSync(`./.data${global.port}.json`));
            }
            if (!this.data.torrents)
                this.data.torrents = {}
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