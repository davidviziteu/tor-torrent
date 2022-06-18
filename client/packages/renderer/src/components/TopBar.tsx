import { createSignal } from 'solid-js';
// const { ipcRenderer } = window.require("electron");
// const { ipcRenderer } = require("electron");
export default function TopBar() {

    return (
        <div id="top-bar" class="drag">
            <div id="app-title" class="no-drag">
                Torano
            </div>
            <div>
                <input style="display: none" class="no-drag" type="number" id="change-port" onkeypress={(key) => {
                    if (key.key === "Enter") {
                        let port = document.getElementById("change-port") as HTMLInputElement;
                        port.style.display = "none";
                        console.log(`backend_port: ${port.value}`);
                        //@ts-ignore
                        if(port.value > 1000)                            
                        //@ts-ignore
                            window.backend_port = port.value;
                        else
                            console.log(`value < 1000`);
                        
                        port.value = "";
                    }
                }}/>
            </div>
            <div class="top-right-button-group">
                <button class="top-right-buttons no-drag" ondblclick={(e) => {
                    let port = document.getElementById("change-port") as HTMLInputElement;
                    if(port.style.display == "none"){
                        port.style.display = "";
                    }
                    else {
                        port.style.display = "none";
                    }
                }}>
                </button>
                <button class="top-right-buttons no-drag" onClick={(e) => {
                    e.preventDefault();
                    window.ipcRenderer.send('minimize');
                }}>
                    <svg width="18" height="18">
                        <line x1="3" y1="9" x2="15" y2="9" style="fill:transparent;stroke:currentColor;stroke-width:1;" />
                    </svg>
                </button>
                <button class="top-right-buttons no-drag" onClick={(e) => {
                    e.preventDefault();
                    window.ipcRenderer.send('maximize');
                }}>
                    <svg width="18" height="18">
                        <rect x="4.5" y="4.5" width="9" height="9" style="fill:transparent;stroke:currentColor;stroke-width:1;" />
                    </svg>
                </button>
                <button class="top-right-buttons no-drag" onClick={(e) => {
                    e.preventDefault();
                    window.ipcRenderer.send('minimize');
                }}>
                    <svg width="18" height="18">
                        <g fill="none" fill-rule="evenodd">
                            <path d="M0 0h18v18H0"></path>
                            <path stroke="currentColor" d="M4.5 4.5l9 9" stroke-linecap="round"></path>
                            <path stroke="currentColor" d="M13.5 4.5l-9 9" stroke-linecap="round"></path>
                        </g>
                    </svg>
                </button>
            </div>
        </div>
    );
}