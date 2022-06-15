import { createSignal } from 'solid-js';
import { createTorrent } from 'create-torrent'

export default function LeftBar() {
    
    
    return (
        <div id="menu-bar" class="drag">
            <button class="no-drag menu-bar-button" title='Load .torano file' onClick={async () => {

                //@ts-ignore
                console.log(`window.port: ${window.port}`);
                //@ts-ignore
                console.log(`electron.port: ${electron.port}`);

                const dialogConfig = {
                    title: 'Select a file or a folder',
                    buttonLabel: 'This one will do',
                    properties: ['openFile', 'dontAddToRecent']
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


            }}>📁</button>
            <button class="no-drag menu-bar-button" title='Create and load new .torano file'>➕</button>
        </div>
    );
}