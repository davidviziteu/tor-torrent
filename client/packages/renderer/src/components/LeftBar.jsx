import { createSignal } from 'solid-js';
import { useNavigate } from 'solid-app-router';
import createTorrentPromise from './createtorrent';

export default function LeftBar() {

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

        const dialogConfig = {
            title: 'Select any file',
            buttonLabel: 'This one will do',
            properties: ['openFile', 'dontAddToRecent'],
        }
        let result = await electron.openDialog('showOpenDialog', dialogConfig)
        if (!result.cancelled && result.filePaths[0]) {
            let filepath = result.filePaths[0]
            console.log('filepath:');
            console.log(filepath);
            let nav = useNavigate();
            nav('/build')

            try {
                let metainfoContent = await createTorrentPromise(filepath)
                let dialogConfig = {
                    //Placeholder 1
                    title: "Save torano file ",
                    buttonLabel: "Save torano File",
                    defaultPath: "C:\\myToranoFile.torano",
                    filters: [
                        { name: '.torano', extensions: ['torano'] },
                    ]
                }
                let result = await electron.openDialog('showSaveDialog', dialogConfig)
                console.log(`result after create torrent file: ${JSON.stringify(result)}`);

            } catch (error) {
                console.log('create torrent error');
                console.log(error);
            }

          
        }
        else {
            console.log('cancelled');
        }
    }


    return (
        <div id="menu-bar" class="drag">
            <button class="no-drag menu-bar-button" title='Load .torano file' onClick={openToranoFile}>📁</button>
            <button class="no-drag menu-bar-button" title='Create and load new .torano file' onClick={createToranoFile}>➕</button>
        </div>
    );
}