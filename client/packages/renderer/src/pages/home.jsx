import { createSignal, createEffect } from 'solid-js';
import { useNavigate } from 'solid-app-router';
import TopBar from '../components/TopBar'
import TorrentItem from '@/components/home/TorrentItem';
import LeftBar from '@/components/LeftBar';
import RightPanel from '@/components/home/RightPanel.jsx';
import routeAccordingly from '@/routeAccordingly';
import fetchBackendData from '@/routines';


export default function Home() {
  console.log('home navigate');
  const nav = useNavigate()
  const [torrents, setTorrents] = createSignal([]); 
  setInterval(() => fetchBackendData(nav), 1000 * 60)
  const removeTorrent = async torrHashToRemove => {
    console.log(`removing torrent ${torrHashToRemove}`);
    setTorrents(torrents().filter(torrItem => torrItem != torrHashToRemove))
    console.log(`torrents after removing: ${torrents()}`);
    fetch(`http://localhost:10000/delete-torrent/${torrHashToRemove}`)
    delete window.data.torrents[torrHashToRemove]
    routeAccordingly(nav)
    return
  }


  const [rightPanelData, setRightPanelData] = createSignal(
    {
      'Onion layers: ': 3,
      'Fake announces / torrent: ': 5,
      'Onions relayed: ': 30,
      'Onions discarded: ': 4,
      'Pieces Uploaded: ': 4,
      'Messages sent: ': 4,
      'Messages responses: ': 1,
      'Max pieces / message: ': 1,
      'Tracker: ': 'localhost:8080',
      'Tracker session (mins): ': 30,
      'Direct tracker contact: ': 'Yes',
    }
  ) 

  async function refreshAllData () {
    window.data = await fetch(`http://localhost:${window.backend_port?window.backend_port:10000}/load`).then(res => res.json())
    let arr = []
    //for values of object
    if (!window.data || !window.data.torrents)
      return;
    for (let [key, value] of Object.entries(window.data.torrents)) {
      arr.push(key)
    }
    setTorrents(arr)
    routeAccordingly(nav)
    setRightPanelData(window.data.stats)
  }
  window.refreshAllData = refreshAllData
  refreshAllData();
  setInterval(refreshAllData, 3000) //1 min

  return (
    <div class="container">
      <LeftBar />
      <main id="main-ui">
        <section id="left-main-section">
          <div id="torrent-filter-buttons">
            <h1>All torrents</h1>
            <h4></h4>
            <h4></h4>
          </div>
          <div id="torrent-list-head" class="torrent-list-grid">
            <span>Name & size</span>
            <span>Status</span>
            <span title='Responses to request messages ratio'>RtRMR</span>
          </div>
          <div id="torrent-list">
            {torrents().map(torrHash => (
              <TorrentItem torrHash={torrHash} removeTorrent={removeTorrent}/>
            ))}
            
          </div>
        </section>
        <section id="right-main-section">
          <RightPanel getter={rightPanelData} />
        </section>
      </main>
    </div>
  );
}
