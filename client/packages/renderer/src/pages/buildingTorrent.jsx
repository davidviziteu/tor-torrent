import { createSignal } from 'solid-js';

import TopBar from '../components/TopBar'
import TorrentItem from '@/components/home/TorrentItem';
import LeftBar from '@/components/LeftBar';
import RightPanel from '@/components/home/RightPanel.jsx';
export default function BuildingTorrent() {

  return (
    <div class="container">
      <LeftBar />
      <main id="main-ui" class='center-text-main-ui'>
        <dir>
          Making a .torano file...
        </dir>
      </main>
    </div>
  );
}
