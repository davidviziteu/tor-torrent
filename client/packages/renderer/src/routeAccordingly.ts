

async function routeAccordingly(nav: any ) {
    if (Object.keys(window.data.torrents).length === 0) {
        if (window.data.trackerAddress)
            nav('/no-torrents')
        else
            nav('/welcome')
    } else {
        nav('/')
    }
}

export default routeAccordingly