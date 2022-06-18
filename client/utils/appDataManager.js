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

    addTorrent(downloadPath, metainfoPath, isFolder = false) {
        let metainfoContent, parsedTorrent
        try {
            metainfoContent = fs.readFileSync(metainfoPath)
        } catch (error) {
            console.log(error);
            console.log('Error reading metainfo file. path: ' + metainfoPath);
            throw ('Error reading the metainfo file');
        }

        if (!fs.existsSync(downloadPath) || !fs.lstatSync(downloadPath).isDirectory()) {
            console.log(`Path to save the torrent is not a folder`);
            throw `Path to save the torrent is not a folder`
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
            throw 'This torrent already exists';
        }

        downloadPath = downloadPath + '/' + parsedTorrent.name
        let fd
        try {
            fd = fs.openSync(downloadPath, 'w+');
        } catch (error) {
            console.log(error);
            console.log('Error opening file to download torrent. path: ' + this.data.torrents[key].filesPath);
            throw 'Error opening file ' + this.data.torrents[key].filesPath
        }


        try {
            let preq = []
            let precv = []
            for (let i = 0; i < parsedTorrent.files.length; i++) {
                preq.push(0)
                precv.push(0)
            }
            this.data.torrents[parsedTorrent.infoHash] = {
                hash: parsedTorrent.infoHash,
                filesPath: downloadPath,
                parsedTorrent: parsedTorrent,
                isFolder: isFolder,
                completed: false,
                piecesRequested: preq,
                piecesReceived: precv,
                requestesSend: 0,
                fd: fd
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
    //done
    createTorrent(filesPath, rawTorrent, isFolder = false) {
        let parsedTorrent = parseTorrent(rawTorrent)
        if (this.data.torrents[parsedTorrent.infoHash]) {
            console.log(`info hash for torrent ${parsedTorrent.name} already exists`);
            return 'exists'
        }
        let fd = 0
        try {
            fd = fs.openSync(filesPath, 'r');
        } catch (error) {
            console.log(error);
            console.log('Error opening file at create torrent. path: ' + this.data.torrents[key].filesPath);
            throw 'Error opening file ' + this.data.torrents[key].filesPath
        }

        this.data.trackerAddress = parsedTorrent.announce[0]
        try {
            //copy metainfo file to "."

            this.data.torrents[parsedTorrent.infoHash] = {
                infoHash: parsedTorrent.infoHash,
                filesPath: filesPath,
                parsedTorrent: parsedTorrent,
                isFolder: isFolder,
                completed: true,
                requestesSend: 0,
                fd: fd
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
        return this.data.torrents;
    }

    getTorrent(hash) {
        return this.data.torrents[hash]
    }

    removeTorrent(hash) {
        let targetTorrent = this.getTorrent(hash);
        if (targetTorrent) {
            delete this.data.torrents[hash];
            this.saveProgress()
            return console.log(`removed torrent ${targetTorrent.parsedTorrent.name}`);
        }
        return console.log(`delete torrent: torrent ${hash} not found`);
    }

    saveProgress() {
        try {
            fs.writeFileSync(`./.data${global.port}.json`, JSON.stringify(this.data));
            console.log('app manager: saved data');
        } catch (error) {
            console.log(error);
            console.log('Error saving data_port_.json');
        }
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
            // in this.data.torrents
            let toRemove = []
            for (const key in this.data.torrents) {
                if (Object.hasOwnProperty.call(this.data.torrents, key)) {
                    if (!this.data.torrents[key].isFolder) {
                        try {
                            if (this.data.torrents[key].completed)
                                this.data.torrents[key].fd = fs.openSync(this.data.torrents[key].filesPath, 'r');
                            else
                                this.data.torrents[key].fd = fs.openSync(this.data.torrents[key].filesPath, 'r+');
                        } catch (error) {
                            console.log(error);
                            console.log('Error opening file. path: ' + this.data.torrents[key].filesPath);
                            console.log('removing torrent');
                            toRemove.push(key)
                        }
                    }
                }
            }
            for (let i = 0; i < toRemove.length; i++) {
                this.removeTorrent(toRemove[i])
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