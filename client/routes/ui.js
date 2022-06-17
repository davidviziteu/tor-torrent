const router = require(`express`).Router()
const createTorrent = require('create-torrent')
const AppManager = require('../utils/appDataManager');
const AppStatsManager = require('../utils/appStatsManager');
const { StatusCodes } = require('http-status-codes')
const cors = require('cors');
// router.use(cors())
router.post(`/load-torrent`, (req, res) => {
    const { metainfoPath, downloadPath } = req.body
    if (!metainfoPath || !downloadPath) return res.status(StatusCodes.BAD_REQUEST).end()
    //test if download path is a folder
    try {
        AppManager.addTorrent(downloadPath, metainfoPath)
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: error,
        })
    }
    return res.status(StatusCodes.OK).end()
})



router.get('/delete-torrent/:hash', (req, res) => {
    const { hash } = req.params
    AppManager.removeTorrent(hash)
    return res.status(StatusCodes.OK).end()
})


router.post(`/create-torrent`, (req, res) => {
    const { sourcePath, destPath } = req.body
    if (!sourcePath || !destPath) return res.status(StatusCodes.BAD_REQUEST).end({
        error: `sourcePath or destPath is missing`
    })
    //test if file exists
    fs.access(sourcePath, fs.constants.R_OK, (err) => {
        if (err) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: `file ${sourcePath} not found`
            })
        }
        createTorrent(sourcePath, {
            comment: 'torano',
            announceList: [[global.trackerAddress]],
        }, (err, torrent) => {
            if (err) {
                console.log(error);
                console.log(`error createTorrent module`);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    error: `error creating torrent: ${JSON.stringify(err)}`
                })
            }
            // `torrent` is a Buffer with the contents of the new .torrent file
            try {
                let exists = AppManager.createTorrent(sourcePath, torrent)
                if (exists == 'exists') {
                    fs.writeFile(destPath, torrent, (err) => {
                        if (err) {
                            console.log(error);
                            console.log(`error fs.writeFile(destPath, torrent`);
                            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                                error: `error writing file ${destPath}: ${JSON.stringify(err)}`
                            })
                        }
                    })
                }
            } catch (error) {
                console.log(error);
                console.log(`error appmanager create torrent`);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    error: `error creating torrent: ${JSON.stringify(error)}`
                })

            }
            return res.status(StatusCodes.OK).end()
        })

    })
})



router.get('/exit', async (req, res) => {
    process.exit(0)
})



router.get('/load', async (req, res) => {
    const data = AppManager.loadProgress()
    //iterate values of data object
    let torrentsObject = {
    }
    for (let [key, value] of Object.entries(data.torrents)) {
        torrentsObject[key] = {
            hash: value.hash,
            completed: value.completed,
            piecesReceived: value.piecesReceived.reduce((acc, cur) => acc + (cur ? 1 : 0), 0),
            requestesSend: value.requestesSend,
            parsedTorrent: {
                length: value.parsedTorrent.length,
                pieceLength: value.parsedTorrent.pieceLength,
                name: value.parsedTorrent.name,
            }
        }
    }
    return res.status(200).json({
        trackerAddress: data.trackerAddress,
        torrents: torrentsObject,
        stats: AppStatsManager.getData()
    })
})

module.exports = router