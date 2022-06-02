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

export default function RightPanel() {
    const leftPanelData = [
        'Onions routed: ',
        'Data routed: ',
        'Onions discarded: ',
        'Data discarded: ',
        'Direct tracker contact: ',
        'Endpoint tracker contact: ',
        'Fake announces: ',
        'Route length: ',
        'Leaking probability: ',
        'Nodes reached (STUN): ',
        'Nodes reached (TURN): ',
    ]
    const [getter, setter] = createSignal(
        {
            'Onions routed: ': 30,
            'Data routed: ': '30MB',
            'Onions discarded: ': 4,
            'Data discarded: ': '60MB',
            'Direct tracker contact: ': 'Yes',
            'Endpoint tracker contact: ': 'Yes',
            'Fake announces: ': 5,
            'Route length: ': 3,
            'Leaking probability: ': 0.1,
            'Nodes reached (STUN): ': 50,
            'Nodes reached (TURN): ': 20,

        }
    ) 

    
    return (
        <div class="panel">
            {leftPanelData.map(stringId => (
                <TableRow leftText={stringId} rightTextGetter={getter} />
            ))}
        </div>
    );
}