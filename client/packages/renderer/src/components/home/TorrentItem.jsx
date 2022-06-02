import { createSignal } from 'solid-js';

export default function TorrentItem(props) {
    const [currentProgress, setCurrentProgress] = createSignal(0);
    const [currentReach, setCurrentReach] = createSignal(0);
    const torrentIdentifier = props.torrentIdentifier;
    const removeTorrent = props.removeTorrent
    console.log(`torrentIdentifier: ${torrentIdentifier}`);
    return (
        <div class="torrent-item torrent-list-grid">
            <span>
                <img src="assets/file-svgrepo-com.svg" alt="" class="file-img"/>
                    <div class="file-data">
                    <div class="file-name-div">{torrentIdentifier}</div>
                        <div class="file-size-div">3.3MB</div>
                    </div>
            </span>
            <span>
                <div class="progress-text">
                    {currentProgress()} %
                </div>
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style={{
                        width: currentProgress()
                    }} aria-valuenow={currentProgress()}
                        aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </span>
            <span>{currentReach()}</span>
        </div>
    );
}
