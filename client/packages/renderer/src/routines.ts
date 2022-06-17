import { useNavigate } from "solid-app-router";


async function fetchBackendData(nav: any) {
    const r = await fetch(`http://localhost:${window.backend_port}/load`)
    window.data = await r.json()
    if (Object.keys(window.data.torrents).length === 0) {
        if(window.data.trackerAddress)
            nav('/no-torrents')
        else
            nav('/welcome')
    } else {
        nav('/')
    }
}

export default fetchBackendData