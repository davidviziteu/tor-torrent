import { createSignal, For } from 'solid-js';

function TableRow(props) {
    const { leftText, rightTextGetter } = props;
    // console.log('rightTextGetter');
    // console.log(rightTextGetter);
    return (
        <div class="right-panel-line">
            <div class="right-panel-line-left-text">
                {leftText}
            </div>
            <div class="right-panel-line-right-text">
             {rightTextGetter()[leftText]}
            </div>
        </div>
    )
}

export default function RightPanel(props) {
    const leftPanelData = [
        'Onion layers: ',
        'Fake announces / torrent: ',
        'Onions relayed: ',
        'Onions discarded: ',
        'Messages sent: ',
        'Messages responses: ',
        'Pieces Uploaded: ',
        'Max pieces / message: ',
        'Tracker: ',
        'Tracker session (mins): ',
        'Direct tracker contact: ',
    ]
    // const [get, setRightPanelData] = createSignal(
    //     {
    //         'Onion layers: ': 3,
    //         'Fake announces / torrent: ': 5,
    //         'Onions relayed: ': 30,
    //         'Onions discarded: ': 4,
    //         'Pieces Uploaded: ': 4,
    //         'Messages sent: ': 4,
    //         'Messages responses: ': 1,
    //         'Max pieces / message: ': 1,
    //         'Tracker: ': 'localhost:8080',
    //         'Tracker session (mins): ': 30,
    //         'Direct tracker contact: ': 'Yes',
    //     }
    // ) 
    console.log(props);
    console.log('rightPanelData');
    return (
        <div class="panel">
            {leftPanelData.map(stringId => (
                <TableRow leftText={stringId} rightTextGetter={props.getter} />
            ))}
        </div>
    );
}