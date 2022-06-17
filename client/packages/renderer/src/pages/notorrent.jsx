import { createSignal } from 'solid-js';

import TopBar from '../components/TopBar'
import TorrentItem from '@/components/home/TorrentItem';
import LeftBar from '@/components/LeftBar';

export default function NoTorrent() {
    return (
        <div class="container">
            <LeftBar />
            <main id="main-ui" class='center-text-main-ui'>
                <h2>
                    You have no active downloads / uploads.
                </h2>
                <dir>
                    Use the left 📁 button to open a .torano file.
                </dir>
                <dir>
                    Use the left ➕ button to create a .torano file from your disk.
                </dir>
                <dir>
                    Use the left ❌ button to exit the application.
                </dir>
            </main>
        </div>
    );
}
