const path = require('path')
const env = process.env.NODE_ENV || 'development';

// If development environment
if (env === 'development') {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
    });
}
const { app, BrowserWindow } = require('electron')

function createWindow() {
    const appInstance = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1000,
        minHeight: 600,
        frame: false,
        // transparent: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
        }
    })

    appInstance.loadFile('UI/index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', (event) => {
    event.preventDefault()
    app.hide()
})
var os = require('os');

console.log(os.type());