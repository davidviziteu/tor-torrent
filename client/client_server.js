const express = require(`express`)
const bodyParser = require(`body-parser`)
require(`./utils/init`)
const app = express()
const procedures = require(`./utils/routines`)
const cors = require('cors');
const devRouter = require('./routes/dev')
const uiRouter = require('./routes/ui')
const relayRouter = require('./routes/relayNode')
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use((req, res, next) => {
    if (req.socket.localAddress === res.socket.remoteAddress)
        req.isLocalIp = true
    next()
})
app.use(devRouter)
app.use(uiRouter)
app.use(relayRouter)
try {
    app.listen(config.port, () =>
        console.log(`Listening on ${config.ip}:${config.port}...`)
    )
} catch (error) {
    if (error.code === 'EADDRINUSE')
        console.log('Port is already in use, probably debugging.');
    else
        console.log(error);

}

if (global.dev) {
    console.log(`dev mode enabled, tracker addr localhost`);
    global.trackerAddress = 'http://localhost:6969'
}


module.exports = {
    appServer: app,
    startRefreshingLoop: procedures.startRefreshingLoop,
}

