import { createSignal } from 'solid-js';

import TopBar from '../components/TopBar'
import TorrentItem from '@/components/home/TorrentItem';
import LeftBar from '@/components/LeftBar';
import RightPanel from '@/components/home/RightPanel.jsx';
export default function Home() {

 
    return (
        <div class="container">
            <LeftBar />
            <main id="main-ui" class='center-text-main-ui'>
                <h2>
                    Welcome.
                </h2>
                <dir>
                    Use the left 📁 button to open a .torano file. I need that to reach the tracker.
                </dir>
                <dir>
                    Then, you can use the ➕ button to create .torano files from your disk.
                </dir>
                <dir>
                    Use the left ❌ button to exit the application.
                </dir>
            </main>
        </div>
    );
}
