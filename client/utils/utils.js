exports.logTimestamp = msg => {
    let now = new Date()
    console.log(`${msg} ${now.getMinutes()}m ${now.getSeconds()}s ${now.getMilliseconds()}ms`)
}

exports.randInt = (max) => {
    return Math.floor(Math.random() * max);
}

exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.randomOfArray = (array, count = 30) => {
    if (array.length <= count) {
        return array
    }
    let dataToReturn = []
    for (let index = 0; index < count; index++) {
        dataToReturn.push(array[this.randInt(array.length - 1)])
    }
    return dataToReturn
}

exports.randomOfArrayExtend = (array, count) => {
    let dataToReturn = []
    for (let index = 0; index < count; index++) {
        dataToReturn.push(array[this.randInt(0, array.length - 1)])
    }
    return dataToReturn
}

exports.randomStringPadding = () => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,./;?><!@#$%^&*()_+-=[]{}|';
    for (var i = 0; i < 5; i++) {
        result += characters.charAt(this.randInt(characters.length));
    }
    return result;
}