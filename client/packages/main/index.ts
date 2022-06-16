import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { release } from 'os'
import { join } from 'path'
import fs from 'fs'

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
}

let win: BrowserWindow | null = null

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      nodeIntegration: true,
    },
  })

  const path = require('path')
  const { spawn } = require("child_process");
  let file: number
  let ls: any
  if (app.isPackaged) {
    win.loadFile(join(__dirname, '../renderer/index.html'))
    file = fs.openSync('./backendlog.txt', 'a')
    ls = spawn("node", [path.resolve('client_server.js')], {stdio: ['ignore', file, file]});

  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`
    win.loadURL(url)
    win.webContents.openDevTools()
    file = fs.openSync('./backendlog.txt', 'a')
    console.log('path: ', path.resolve('client_server.js'));
    try {
      ls = spawn("node", [path.resolve('client_server.js')], { stdio: ['ignore', file, file] });
    } catch (error) {
      console.log('spawn error');
      console.log(error);
            
    }
  }

  // Test active push message to Renderer-process
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })




  //openfile for appending and createing a file if it doesn't exist
  fs.writeFile(file, `\n`, (err) => { });
  fs.writeFile(file, `\n`, (err) => { });
  fs.writeFile(file, `${Date.now()}`, (err) => { });

  //@ts-ignore
  // ls.on("data", data => {
  //   fs.writeFile(file, `${data}`, (err) => { });
  // });
  //@ts-ignore
  ls.on("data", data => {
    fs.writeFile(file, `${data}`, (err) => { });
  });

  //@ts-ignore
  ls.on('error', (error) => {
    fs.writeFile(file, `${error}`, (err) => { });
  });

  //@ts-ignore
  ls.on("close", code => {
    fs.writeFile(file, `child process exited with code ${code}`, (err) => { });
    console.log(`child process exited with code ${code}`);
  });


}

app.whenReady().then(() => {


  createWindow()
  console.log('App is ready');
  const fs = require('fs')
  fs.writeFileSync('D:/electronout.txt', process.cwd())
  
  ipcMain.handle('dialog', async (event, method, params) => {
    // @ts-ignore
    return await dialog[method](params);
  });
})

app.on('window-all-closed', () => {
})



ipcMain.on('close', () => {
  app.quit()
})

ipcMain.on('minimise', () => {
  win?.minimize()
})

ipcMain.on('maximize', () => {
  if (win) {
    win.isMaximized()?win.maximize():win.unmaximize()
  }
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

