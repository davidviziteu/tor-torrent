class A {
    cellType = '' //transit cell or data cell
    nextNodeIp = '' //ip of next node
    data = '' //data. json or encrypted stringyfied json
    function = () => {
        console.log('bb');
    }
};

b = new A();
b.function();
b = JSON.stringify(b);
console.log(b);
