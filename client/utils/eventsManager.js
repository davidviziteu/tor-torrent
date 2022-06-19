const EventEmitter = require('events');
// const EventEmitter = require('node:events'); //???????

let eventEmitterInstance = null

function getInstance() {
    if (!eventEmitterInstance) {
        eventEmitterInstance = new EventEmitter();
    }
    return eventEmitterInstance;
}

exports.eventEmitter = getInstance()
exports.trackerRefreshSessionEv = 'trackerRefreshSession'
