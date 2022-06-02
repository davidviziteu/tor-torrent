import { createSignal } from 'solid-js';

import TopBar from '../components/TopBar'
import TorrentItem from '@/components/home/TorrentItem';
import LeftBar from '@/components/LeftBar';
import RightPanel from '@/components/home/RightPanel.jsx';
export default function Home() {

  const [torrents, setTorrents] = createSignal([]);
  const addTorrent = value => {
    return setTorrents([...torrents(), value]);
  };
  const removeTorrent = identifierToRemove => {
    return setTorrents(torrents().filter(identifier => identifier != identifierToRemove))
  }
  // setInterval(() => {
  //   addTorrent(1)
  // }, 1000)
  addTorrent('Fung fu panda')
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
            <span>Name & size</span>
            <span>Status</span>
            <span>Reach</span>
          </div>
          <div id="torrent-list">
            {torrents().map(id => (
              <TorrentItem torrentIdentifier={id} removeTorrent={removeTorrent}/>
            ))}
            
          </div>
        </section>
        <section id="right-main-section">
          <RightPanel/>
        </section>
      </main>
    </div>
  );
}
