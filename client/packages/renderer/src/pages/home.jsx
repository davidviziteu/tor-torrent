import { createSignal } from 'solid-js';

import TopBar from '../components/TopBar'
import TorrentItem from '@/components/home/TorrentItem';
import LeftBar from '@/components/LeftBar';
import RightPanel from '@/components/home/RightPanel.jsx';
export default function Home() {

  const [torrents, setTorrents] = createSignal([]);
  // const addTorrent = value => {
  //   return setTorrents([...torrents(), value]);
  // };
  const removeTorrent = torrItemToRemove => {
    return setTorrents(torrents().filter(torrItem => torrItem.hash != torrItemToRemove.hash))
  }

  const refreshTorrentList = async () => {
    let arr = []
    //for values of object
    if (!window.data || !window.data.torrents)
      return;
    for (let [key, value] of Object.entries(window.data.torrents)) {
      arr.push(value)
    }
    setTorrents(arr)
  }
  ; (refreshTorrentList)();
  setInterval(refreshTorrentList, 2000)

  return (
    <div class="container">
      <LeftBar/>
      <main id="main-ui">
        <section id="left-main-section">
          <div id="torrent-filter-buttons">
            <h1>All active torrents</h1>
            <h4></h4>
            <h4></h4>
          </div>
          <div id="torrent-list-head" class="torrent-list-grid">
            <span>Name & size</span>
            <span>Status</span>
            <span>Reach</span>
          </div>
          <div id="torrent-list">
            {torrents().map(torrItem => (
              <TorrentItem torrentItem={torrItem} removeTorrent={removeTorrent}/>
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
