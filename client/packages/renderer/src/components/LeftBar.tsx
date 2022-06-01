import { createSignal } from 'solid-js';
export default function LeftBar() {

    return (
        <div id="menu-bar" class="drag">
            <button class="no-drag menu-bar-button">📁</button>
            <button class="no-drag menu-bar-button">Load</button>
            <button class="no-drag menu-bar-button">➕</button>
            <button class="no-drag menu-bar-button">⚙️</button>
        </div>
    );
}