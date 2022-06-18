const fs = require('fs')

//only for statisics - right panel of the screen
let statsManager = null
class AppStatsManager {
    constructor() {
        this.data = {
            'Onion layers: ': 0,
            'Fake announces / torrent: ': 5,
            'Onions relayed: ': 0,
            'Onions discarded: ': 0,
            'Pieces Uploaded: ': 0,
            'Messages sent: ': 0,
            'Messages responses: ': 0,
            'Max pieces / message: ': 0,
            'Tracker: ': 'localhost:8080',
            'Tracker session (mins): ': 0,
            'Direct tracker contact: ': 'Yes',
        }
    }
    setOnionLayers(layers) {
        this.data['Onion layers: '] = layers
    }
    setFakeAnnounces(fakeAnnounces) {
        this.data['Fake announces / torrent: '] = fakeAnnounces
    }
    incrementOnionRelayed() {
        this.data['Onions relayed: ']++
    }
    incrementOnionDiscarded() {
        this.data['Onions discarded: ']++
    }
    incrementPiecesUploaded() {
        this.data['Pieces Uploaded: ']++
    }
    incrementMessagesSent() {
        this.data['Messages sent: ']++
    }
    incrementMessagesResponses() {
        this.data['Messages responses: ']++
    }
    setMaxPiecesPerMessage(maxPiecesPerMessage) {
        this.data['Max pieces sent / message: '] = maxPiecesPerMessage
    }
    setTrackerSession(mins) {
        this.data['Tracker session (mins): '] = mins
    }
    setDirectTrackerContact(bool) {
        this.data['Direct tracker contact: '] = bool ? 'Yes' : 'No'
    }
    setTrackerAddress(url) {
        if (url.includes('http://')) {
            url = url.replace('http://', '')
        }
        if (url.includes('https://')) {
            url = url.replace('https://', '')
        }
        this.data['Tracker: '] = url
    }
    getData() {
        return this.data
    }
}


function getInstance() {
    if (statsManager === null) {
        statsManager = new AppStatsManager();
    }
    return statsManager;
}

module.exports = getInstance();