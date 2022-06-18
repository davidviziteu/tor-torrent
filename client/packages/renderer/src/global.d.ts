
export { }


interface IParsedTorrent {
  infoHash: string;
  name: string;
  length: number;
  pieceLength: number;
  lastPieceLength: number;
  pieces: string[];
}

interface ITorrentListItem{
  hash: string;
  completed: boolean
  parsedTorrent: IParsedTorrent;
  piecesRequested: boolean[];
  piecesRecieved: boolean[];
  requestesSend: number
}

interface IBackendDataOject {
  trackerAddress: string | null;
  torrents: { string: ITorrentListItem };
  stats: Object;
  trackerError: string | null,
  keysError: string | null,
}


declare global {
  interface Window {
    // Expose some Api through preload script
    fs: typeof import('fs')
    ipcRenderer: import('electron').IpcRenderer
    _backend_port: number
    backend_port: number
    spawn: typeof import('child_process').spawn
    removeLoading: () => void
    data: IBackendDataOject;
    cwd: string
    ParseTorrentFile: any,
    refreshAllData: () => void,
    promptUser: any,
    setError: (error: string) => void,
    getError: () => string,
  }
}
