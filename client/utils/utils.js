exports.logTimestamp = msg => {
    let now = new Date()
    console.log(`${msg} ${now.getMinutes()}m ${now.getSeconds()}s ${now.getMilliseconds()}ms`)
}

exports.getRandomArbitrary = (min, max) => {
    return Math.random() * (max - min) + min;
}

exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}