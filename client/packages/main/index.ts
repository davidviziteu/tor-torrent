import { app, BrowserWindow, shell, ipcMain, dialog, Menu, Tray } from 'electron'
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
  const path = require('path')
  const { spawn } = require("child_process");
  let file: number
  let backendServerProcess: any
  //https://www.npmjs.com/package/get-port-electron
  //daca mai e timp...
  file = fs.openSync('./backendlog.txt', 'a')
  try {
    backendServerProcess = spawn("node", [path.resolve('client_server.js')], { stdio: ['ignore', file, file], windowsHide: true });
  } catch (error) {
    console.log('spawn error');``
    console.log(error);
    if (app.isPackaged) {
      dialog.showErrorBox('Backend server failed to start', JSON.stringify(error));
      app.quit();
    }
  }
  //openfile for appending and createing a file if it doesn't exist
  fs.writeFile(file, `\n`, (err) => { });
  fs.writeFile(file, `\n`, (err) => { });
  fs.writeFile(file, `${Date.now()}`, (err) => { });

  //@ts-ignore
  backendServerProcess.on("data", data => {
    fs.writeFile(file, `${data}`, (err) => { });
  });

  //@ts-ignore
  backendServerProcess.on('error', (error) => {
    fs.writeFile(file, `${error}`, (err) => { });
  });

  //@ts-ignore
  backendServerProcess.on("close", code => {
    fs.writeFile(file, `child process exited with code ${code}`, (err) => { });
    console.log(`child process exited with code ${code}`);
  });




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
      nodeIntegration: true
    },
  })

  win.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } });
    },
  );
  
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        'Access-Control-Allow-Origin': ['*'],
        // We use this to bypass headers
        'Access-Control-Allow-Headers': ['*'],
        ...details.responseHeaders,
      },
    });
  });

  if (app.isPackaged) {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`
    win.loadURL(url)
    win.webContents.openDevTools()
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
}

app.whenReady().then(() => {
  let tray = new Tray(process.cwd() + '/build/icon.ico')
  tray.setToolTip('Torano client')
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Exit', type: 'normal', click: () => {
        app.exit();
      }
    },
  ]))
  createWindow()
  console.log('App is ready');
  ipcMain.handle('dialog', async (event, method, params) => {
    // @ts-ignore
    return await dialog[method](params);
  });
})

app.on('window-all-closed', () => {
})



ipcMain.on('close', () => {
  console.log('close');
  app.quit()
})

ipcMain.on('minimize', () => {
  win?.minimize()
})

ipcMain.on('maximize', () => {
  if (win) {
    win.isMaximized() ? win.unmaximize():win.maximize()
  }
})

app.on('second-instance', () => {
  if (win) {
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

