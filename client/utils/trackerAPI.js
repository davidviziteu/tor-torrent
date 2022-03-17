const fetch = require('node-fetch')

exports.fetchNodes = async (count, destip, destport) => {
    count++ // to avoid the destination node in the hops list. tracker already does not return a node with the sender's ip addr
    return new Promise((resolve, reject) => {
        fetch(`http://localhost:6969/scrape/nodes/${count}`).then(res => {
            if (res.status != 200)
                return reject(`fetching ${count} hops failed. tracker status code: ${responsePbKey.status}`)
            return res.json().then(_json => {
                _json = _json.nodes
                const foundIndex = _json.findIndex(itm => itm.ip == destip && itm.port == destport)
                if (foundIndex >= 0)
                    _json.splice(foundIndex, 1)
                else
                    _json.pop()
                resolve(_json)
            }) //TODO filter the destination node from the hops list provided by the tracker
        })
    })
}

exports.getPublicKeyOfNode = async (destip, destport) => {
    return new Promise((resolve, reject) => {
        fetch(`http://localhost:6969/publickeyof/${destip}/${destport}`).then(res => {
            if (res.status != 200)
                return reject(`fetch public key of destination node ${destip}:${destport} ` +
                    `failed. tracker status code: ${responsePbKey.status}`)
            return res.json().then(_json => resolve(_json))
        })
    })
}


exports.announce = async () => {
    try {
        const response = await fetch(`http://localhost:6969/announce/node`,
            {
                headers: {
                    "Content-Type": "application/json"
                },
                method: `POST`,
                body: JSON.stringify({
                    port: config.port,
                    publicKey: global.publicKeyString,
                    privateKey: global.privateKeyString
                })
            })
        if (response.status != 200) {
            console.log(await response.text());
            let json = await response.json()
            throw json.error
        }
        console.log(`announce ok`);
    } catch (error) {
        console.error(error)
        console.log(`error at announce`);
    }
}