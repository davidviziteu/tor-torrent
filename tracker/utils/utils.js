exports.randomOfArray = (array, count = 30) => {
    if (array.length <= count) {
        return array
    }
    let dataToReturn = []
    for (let index = 0; index < count; index++) {
        dataToReturn.push(array[this.getRandomArbitrary(0, array.length - 1)])
    }
    return dataToReturn
}

exports.logTimestamp = msg => {
    let now = new Date()
    console.log(`${msg} ${now.getMinutes()}m ${now.getSeconds()}s ${now.getMilliseconds()}ms`)
}

exports.getRandomArbitrary = (min, max) => {
    return Math.random() * (max - min) + min;
}
