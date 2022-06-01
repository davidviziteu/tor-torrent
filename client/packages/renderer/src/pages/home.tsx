import { createSignal } from 'solid-js';

import TopBar from '../components/TopBar'
import AllUi from '../components/home/AllUi'
import LeftBar from '@/components/LeftBar';
export default function Home() {
  const [count, setCount] = createSignal(0);

  return (
    <div class="container">
      <LeftBar/>
      <main id="main-ui">
        <section id="left-main-section">
          <div id="torrent-filter-buttons">
            <h1>All</h1>
            <h4>Downloading</h4>
            <h4>Downloaded</h4>
          </div>
          <div id="torrent-list-head" class="torrent-list-grid">
            <span>Name, size</span>
            <span>Status</span>
            <span>Reach</span>
          </div>
          <div id="torrent-list">
          </div>
        </section>
        <section id="right-main-section">
          <div class="panel">
          </div>
        </section>
      </main>
    </div>
  );
}
