const fetch = require('node-fetch')

exports.fetchHops = async (count, destip, destport) => {
    count += 2 // to avoid the me and destination node in the hops list. tracker already does not return a node with the sender's ip addr
    return new Promise((resolve, reject) => {
        console.log(`promise`);
        fetch(`http://localhost:6969/scrape/nodes/${count}`).then(res => {
            console.log(`fetched from tracker`);
            if (!res.ok)
                reject(`fetching ${count} hops failed. tracker status code: ${res.status}`)
            res.json().then(_json => {
                _json = _json.nodes
                let foundIndex = _json.findIndex(itm => itm.ip == destip && itm.port == destport)
                if (foundIndex >= 0)
                    _json.splice(foundIndex, 1)
                else
                    _json.pop()
                if (!global.myIp) {
                    console.log('[WARNING] announce was not succesful. global.myIp is not defined')
                    resolve(_json)
                }
                foundIndex = _json.findIndex(itm => itm.ip == global.myIp && itm.port == global.config.port)
                if (foundIndex >= 0)
                    _json.splice(foundIndex, 1)
                else
                    _json.pop()
                resolve(_json)
            }) //TODO filter the destination node from the hops list provided by the tracker
        }, error => {
            reject(`fetching ${count} hops failed. tracker status code: ${error}`)
        })
    })
}



// exports.fetchHops = async (count, destip, destport) => {
//     count++ // to avoid the destination node in the hops list. tracker already does not return a node with the sender's ip addr
//     console.log(`promise build`);
//     let res = await fetch(`http://localhost:6969/scrape/nodes/${count}`)
//     console.log(`fetched from tracker`);
//     if (!res.ok)
//         throw `fetching ${count} hops failed. tracker status code: ${res.status}`
//     let _json = await res.json()
//     //TODO filter the destination node from the hops list provided by the tracker
//     _json = _json.nodes
//     const foundIndex = _json.findIndex(itm => itm.ip == destip && itm.port == destport)
//     if (foundIndex >= 0)
//         _json.splice(foundIndex, 1)
//     else
//         _json.pop()
//     return _json
// }


exports.getPublicKeyOfNode = async (destip, destport) => {
    return new Promise((resolve, reject) => {
        fetch(`http://localhost:6969/publickeyof/${destip}/${destport}`).then(res => {
            if (res.status != 200)
                return reject(`fetch public key of destination node ${destip}:${destport} ` +
                    `failed. tracker status code: ${res.status}`)
            return res.json().then(_json => resolve(_json.publicKey))
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
        let json = await response.json()
        console.log(`announce ok`);
        global.publicIp = json.publicIp
        console.log(`tracker ip: ${global.publicIp}`);
    } catch (error) {
        console.error(error)
        console.log(`error at announce`);
    }
}