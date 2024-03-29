import fs from 'fs'
import { contextBridge, ipcRenderer, shell } from 'electron'
import { domReady } from './utils'
import { useLoading } from './loading'
import { spawn } from 'child_process'
const { appendLoading, removeLoading } = useLoading()

;(async () => {
  await domReady()
  appendLoading()
})()



// --------- Expose some API to the Renderer process. ---------
contextBridge.exposeInMainWorld('cwd', process.cwd())
contextBridge.exposeInMainWorld('fs', fs)
contextBridge.exposeInMainWorld('shell', shell)
contextBridge.exposeInMainWorld('removeLoading', removeLoading)
contextBridge.exposeInMainWorld('_backend_port', 10000)
contextBridge.exposeInMainWorld('spawn', spawn)
contextBridge.exposeInMainWorld('ipcRenderer', withPrototype(ipcRenderer))
contextBridge.exposeInMainWorld('electron', {
  // @ts-ignore
  openDialog: (method, config) => ipcRenderer.invoke('dialog', method, config)
});
// `exposeInMainWorld` can't detect attributes and methods of `prototype`, manually patching it.
function withPrototype(obj: Record<string, any>) {
  const protos = Object.getPrototypeOf(obj)

  for (const [key, value] of Object.entries(protos)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) continue

    if (typeof value === 'function') {
      // Some native APIs, like `NodeJS.EventEmitter['on']`, don't work in the Renderer process. Wrapping them into a function.
      obj[key] = function (...args: any) {
        return value.call(obj, ...args)
      }
    } else {
      obj[key] = value
    }
  }
  return obj
}
