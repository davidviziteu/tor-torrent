import { createSignal } from 'solid-js';
import { useNavigate } from 'solid-app-router';
import routeAccordingly from '@/routeAccordingly';
// import createTorrentPromise from './createtorrent';

export default function LeftBar(props) {
    let nav = useNavigate()

    async function openToranoFile() {
        //@ts-ignore
        console.log(`window.port: ${window.port}`);
        //@ts-ignore
        console.log(`electron.port: ${electron.port}`);

        const dialogConfig = {
            title: 'Select a .torano file',
            buttonLabel: 'This one will do',
            properties: ['openFile', 'dontAddToRecent'],
            filters: [
                { name: '.torano', extensions: ['torano'] },
            ]
        };
        //@ts-ignore
        let result = await electron.openDialog('showOpenDialog', dialogConfig)

        // let filepath = await window.dialog.showOpenDialog({ properties: })
        if (result.filePaths && !result.cancelled) {
            let filepath = result.filePaths[0]
            console.log('filepath:');
            console.log(filepath);

            // createTorrent(filepath).then(torrent => {
            //     console.log(torrent)
            // })
        }
        else {
            console.log('cancelled');
        }
    }
    
    async function createToranoFile() {
        let dialogConfig = {
            title: 'Select any file',
            buttonLabel: 'This one will do',
            properties: ['openFile', 'dontAddToRecent'],
        }
        let resultSource = await (await electron.openDialog('showOpenDialog', dialogConfig))
        // console.log(`result after opening file or folder: ${JSON.stringify(resultSource)}`);

        if (!resultSource || resultSource.canceled) {
            console.log('cancecled');
            return;
        }

        let fileName = resultSource.filePaths[0].split('/').pop();
        fileName = fileName.split('.').slice(0, -1).join('.');
        dialogConfig = {
            //Placeholder 1
            title: "Save torano file ",
            buttonLabel: "Save torano file here",
            defaultPath: `C:\\${fileName}.torano`,
            filters: [
                { name: '.torano', extensions: ['torano'] },
            ]
        }
        let resultDest = await electron.openDialog('showSaveDialog', dialogConfig)
        console.log(`result after clicking save: ${JSON.stringify(resultDest)}`);
        if (!resultDest || resultDest.canceled)
            return;
        nav('/build')
        let backendResult
        try {
            console.log('fetch backend create torrent');
            backendResult = await fetch(`http://localhost:${window.backend_port}/create-torrent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourcePath: resultSource.filePaths[0],
                    destPath: resultDest.filePath
                })
            })
        } catch (error) {
            console.log(error);
            console.log('error fetch backend create torrent');
            electron.openDialog('showMessageBox', {
                type: 'error',
                title: 'Error',
                message: JSON.stringify(error),
            })
            nav('/welcome')
            return
        }
       
        if (backendResult.ok) {
            electron.openDialog('showMessageBox', {
                type: 'info',
                title: 'Success',
                message: 'torano file created successfully',
            })
            nav('/')
        }
        else {
            electron.openDialog('showMessageBox', {
                type: 'error',
                title: 'Error',
                message: 'torano file creation failed',
            })
            nav('/welcome')
        }
        props.refreshTorrentList()
    }


    return (
        <div id="menu-bar" class="drag">
            <button class="no-drag menu-bar-button" title='Load a .torano file' onClick={openToranoFile}>📁</button>
            <button class="no-drag menu-bar-button" title='Create and load new .torano file' onClick={createToranoFile}>➕</button>
            <button class="no-drag menu-bar-button" title='Exit application' onClick={() => {
                window.ipcRenderer.send('close');
            }}>❌</button>
        </div>
    );
}