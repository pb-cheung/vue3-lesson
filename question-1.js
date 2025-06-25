// 为什么要使用Reflect和Proxy搭配使用

const person = {
  name: 'pb',
  get aliasName() {
    return this.name + ' is handsome';
  },
};

let proxyPerson = new Proxy(person, {
  get(target, key, receiver) {
    console.log('key: ', key);
    // return target[key]; // 这种方式访问了person.name 但是不会触发get
    // return receiver[key]; // 会造成死循环，一直打印aliasName
    return Reflect.get(target, key, receiver);
  },
});

console.log(proxyPerson.aliasName);

// Proxy的get处理函数中，使用不同的方式来访问属性

//  return target[key]
// $ node question-1.js
// key:  aliasName
// pb is handsome
// 解释
// 开始执行`proxyPerson.aliasName`，是访问Proxy实例的属性，会被拦截走到Proxy的get处理函数，程序运行到console.log('key: ', key);，因而第一行会打印key aliasName
// 程序继续执行，target[key]，是直接访问目标对象的属性，等价于`person.aliasName` != `proxyPerson.aliasName`，这种方式没有被拦截和代理，正常执行aliasName函数，
// 其中的this指向person，等价于`person.name`，同样没有被拦截和代理，不会走到Proxy的get处理函数，所以没有打印`pb`，第二行打印了`person.aliasName`的返回值

// return receiver[key];
// key aliasName
// key aliasName
// ...
// 不停的输出aliasName，直到崩溃终止。
// 解释
// 开始执行`proxyPerson.aliasName`，是访问Proxy实例的属性，会被拦截走到Proxy的get处理函数，程序运行到console.log('key: ', key);，因而第一行会打印key aliasName
// 继续执行到`receiver[key]`等价于`proxyPerson.aliasName`，所以陷入了循环会到上一步情况

// return Reflect.get(target, key, receiver);
// $ node question-1.js
// key:  aliasName
// key:  name
// pb is handsome
// 解释
// `Reflect`让`this`指向了`receiver`即代理对象`proxyPerson`。
