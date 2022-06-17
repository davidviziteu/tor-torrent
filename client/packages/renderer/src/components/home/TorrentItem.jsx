import { createSignal } from 'solid-js';
import DeleteSvg from './DeleteSvg';
import FileSvg from './FileSvg';

export default function TorrentItem(props) {
    const [currentProgress, setCurrentProgress] = createSignal(0);
    const [name, setName] = createSignal('');
    const [size, setSize] = createSignal('');
    const [currentRatio, setCurrentRatio] = createSignal('');
    const torrentHash = props.torrHash;
    const removeTorrent = props.removeTorrent
    
    const updateData = () => {
        const torrentItem = window.data.torrents[torrentHash];
        if (!torrentItem) {
            removeTorrent(torrentHash);
            return
        }
        let parsedTor = torrentItem.parsedTorrent;
        setSize(prettyBytes(parsedTor.length));
        setName(parsedTor.name);
        let percent
        if (torrentItem.completed) {
            percent = 100
            setCurrentRatio('-')
        }
        else {
            let pcsRecv = torrentItem.piecesRecieved.reduce((acc, cur) => acc + (cur ? 1 : 0), 0)
            setCurrentRatio(`${pcsRecv / torrentItem.requestesSend}`)
            percent = (pcsRecv / torrentItem.piecesRecieved.length) * 100;
        }
        setCurrentProgress(percent)
    }

    updateData()
    setInterval(updateData, 1000)

    const [getDeleteSvg, setDeleteSvg] = createSignal('none');
    const [getFileSvg, setFileSvg] = createSignal('');
    
    return (
        <div class="torrent-item torrent-list-grid">
            <span>
                <FileSvg setDeleteSvg={setDeleteSvg} getFileSvg={getFileSvg} getDeleteSvg={getDeleteSvg} setFileSvg={setFileSvg} />
                <DeleteSvg getDeleteSvg={getDeleteSvg} setFileSvg={setFileSvg} setDeleteSvg={setDeleteSvg} getFileSvg={getFileSvg} />
                {/* <img src="resources/file.svg" alt="" class="file-img" onmouseover="this.src ='resources/x.svg'"
                    onmouseleave="this.src ='resources/file.svg'" onClick={
                        () => {
                            console.log('icon cliecked');
                            removeTorrent(torrentHash)
                        }
                    }/> */}
                    <div class="file-data">
                    <div class="file-name-div" onDblClick={
                        () => {
                            console.log('name clicked');
                            window.data.torrents[torrentHash].parsedTorrent.files.forEach(file => {
                                console.log(file.name);
                            }
                            )
                        }
                    }>{name()}</div>
                    <div class="file-size-div">{size()}</div>
                    </div>
            </span>
            <span>
                <div class="progress-text">
                    {currentProgress()} %
                </div>
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style={{
                        width: `${currentProgress() }%`
                    }} aria-valuenow={currentProgress()}
                        aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </span>
            <span>{currentRatio()}</span>
        </div>
    );
}




// https://github.com/sindresorhus/pretty-bytes/blob/main/index.js
const BYTE_UNITS = [
    'B',
    'kB',
    'MB',
    'GB',
    'TB',
    'PB',
    'EB',
    'ZB',
    'YB',
];

const BIBYTE_UNITS = [
    'B',
    'kiB',
    'MiB',
    'GiB',
    'TiB',
    'PiB',
    'EiB',
    'ZiB',
    'YiB',
];

const BIT_UNITS = [
    'b',
    'kbit',
    'Mbit',
    'Gbit',
    'Tbit',
    'Pbit',
    'Ebit',
    'Zbit',
    'Ybit',
];

const BIBIT_UNITS = [
    'b',
    'kibit',
    'Mibit',
    'Gibit',
    'Tibit',
    'Pibit',
    'Eibit',
    'Zibit',
    'Yibit',
];

/*
Formats the given number using `Number#toLocaleString`.
- If locale is a string, the value is expected to be a locale-key (for example: `de`).
- If locale is true, the system default locale is used for translation.
- If no value for locale is specified, the number is returned unmodified.
*/
const toLocaleString = (number, locale, options) => {
    let result = number;
    if (typeof locale === 'string' || Array.isArray(locale)) {
        result = number.toLocaleString(locale, options);
    } else if (locale === true || options !== undefined) {
        result = number.toLocaleString(undefined, options);
    }

    return result;
};

let prettyBytes = (number, options) => {
    if (!Number.isFinite(number)) {
        throw new TypeError(`Expected a finite number, got ${typeof number}: ${number}`);
    }

    options = {
        bits: false,
        binary: false,
        ...options,
    };

    const UNITS = options.bits
        ? (options.binary ? BIBIT_UNITS : BIT_UNITS)
        : (options.binary ? BIBYTE_UNITS : BYTE_UNITS);

    if (options.signed && number === 0) {
        return ` 0 ${UNITS[0]}`;
    }

    const isNegative = number < 0;
    const prefix = isNegative ? '-' : (options.signed ? '+' : '');

    if (isNegative) {
        number = -number;
    }

    let localeOptions;

    if (options.minimumFractionDigits !== undefined) {
        localeOptions = { minimumFractionDigits: options.minimumFractionDigits };
    }

    if (options.maximumFractionDigits !== undefined) {
        localeOptions = { maximumFractionDigits: options.maximumFractionDigits, ...localeOptions };
    }

    if (number < 1) {
        const numberString = toLocaleString(number, options.locale, localeOptions);
        return prefix + numberString + ' ' + UNITS[0];
    }

    const exponent = Math.min(Math.floor(options.binary ? Math.log(number) / Math.log(1024) : Math.log10(number) / 3), UNITS.length - 1);
    number /= (options.binary ? 1024 : 1000) ** exponent;

    if (!localeOptions) {
        number = number.toPrecision(3);
    }

    const numberString = toLocaleString(Number(number), options.locale, localeOptions);

    const unit = UNITS[exponent];

    return prefix + numberString + ' ' + unit;
}