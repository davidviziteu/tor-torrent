import { createSignal } from 'solid-js';

import TopBar from '../components/TopBar'
import TorrentItem from '@/components/home/TorrentItem';
import LeftBar from '@/components/LeftBar';
import RightPanel from '@/components/home/RightPanel.jsx';
export default function Error() {

  return (
    <div class="container">
      <LeftBar />
      <main id="main-ui" class='center-text-main-ui'>
        <div>
          Hmm...
        </div>
        <dir>
          The tracker does not seem to be reacheable. Retry? ADD BTN
        </dir>
      </main>
    </div>
  );
}
