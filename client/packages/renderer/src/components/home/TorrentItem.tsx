import { createSignal } from 'solid-js';

export default function TorrentItem() {
    const [currentProgress, setCurrentProgress] = createSignal(0);

    return (
        <div class="torrent-item torrent-list-grid">
            <span>
                <img src="assets/file-svgrepo-com.svg" alt="" class="file-img"/>
                    <div class="file-data">
                        <div class="file-name-div">nume nume nume nume nume nume nume</div>
                        <div class="file-size-div">3.3MB</div>
                    </div>
            </span>
            <span>
                <div class="progress-text">
                    {currentProgress()}
                </div>
                <div class="progress">
                    <div class="progress-bar bg-success" role="progressbar" style="width: 25%" aria-valuenow={currentProgress()}
                        aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </span>
            <span>3</span>
        </div>
    );
}
