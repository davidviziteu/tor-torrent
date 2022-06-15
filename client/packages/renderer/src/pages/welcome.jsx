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
                <div>
                Welcome.
                </div>
                <dir>
                Use the left buttons to create a new torano file or to open an existing one.
                </dir>
            </main>
        </div>
    );
}
