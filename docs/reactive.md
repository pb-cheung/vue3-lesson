# reactive

## API 介绍

**reactive** 是实现响应式最基础的 API，它只能对**对象类型**添加响应式。
（因为它是基于`Proxy`实现的，`Proxy`只支持代理对象不支持**原始类型**）

**ref**，为原始类型数据添加响应式。（传入 ref 的对象会使用 reactive 创建响应式）

## 实现原理

[深入响应式系统](https://cn.vuejs.org/guide/extras/reactivity-in-depth.html)：

> ## Vue 中的响应性是如何工作的 ​
>
> 我们无法直接追踪对上述示例中局部变量的读写，原生 JavaScript 没有提供任何机制能做到这一点。但是，我们是可以追踪对象属性的读写的。

> 在 JavaScript 中有两种劫持 property 访问的方式：getter / setters 和 Proxies。Vue 2 使用 getter / setters 完全是出于支持旧版本浏览器的限制。而在 Vue 3 中则使用了 Proxy 来创建响应式对象，仅将 getter / setter 用于 ref。

> 响应式对象是 JavaScript 代理，其行为就和普通对象一样。不同的是，Vue 能够拦截对响应式对象所有属性的访问和修改，以便进行依赖追踪和触发更新。

Prox 中
get 函数：访问，依赖追踪
set 函数，修改，触发更新

## 实现要点

### 1.代理缓存

```javascript
// 在同一个对象上调用 reactive() 会返回相同的代理
console.log(reactive(raw) === proxy); // true
```

这一特性使用了`WeakMap`实现。
目标对象作`key`，代理对象作`value`，添加到 WeakMap 中，创建代理之前先检查缓存是否已经存在。

使用 WeakMap 有以下优点：

- 键是弱引用，自动管理关联数据的声明周期（key 不再使用了，对应的一条记录也会被垃圾回收），不易导致内存泄漏
- 适用于私有属性、DOM 关联数据、临时缓存

#### 弱引用相关的概念

- 原始值存储在栈区，没有“引用”的概念，
- 对象存储在栈区，有引用、可达性，GC 通过引用计数和可达性判断回收
- 弱引用：如果（除了 WeakMap 中的引用）没有其他变量引用这个对象，就可以将其垃圾回收，WeakMap 中这个引用不算，不会干扰对象的垃圾回收。

### 2.防止代理“代理对象”

```javascript
// 在一个代理上调用 reactive() 会返回它自己
console.log(reactive(proxy) === proxy); // true
```

- 创建响应式之前，添加判断
- 判断方法：访问目标对象特定的属性`ReactiveFlags.IS_REACTIVE`，返回值是 true 则是已经代理的对象（直接返回该对象）
- proxy，handler.get 中要添加对应的逻辑，如果 key 是`ReactiveFlags.IS_REACTIVE`，直接返回 true

### 3. Reflect 的使用

baseHandler 模块，在 Proxy 的 handler 的 get/set 方法（属性读取/设置操作的捕捉器）中

- 使用`Reflect.get(target, key, receiver)`替换`target[key]`
- 使用`Reflect.set(target, key, value, receiver)`代替`target[key]=value`

Reflect 可以更准确地模仿 JS 内部属性访问和设置的行为，兼容原型链、getter/setter。

举例：

```javascript
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
```

person 对象中 aliasName 属性是一个`getter`，handler.get 中使用`target[key]`方式访问，等价于`person.aliasName()`，getter 函数内的`this`指向 person 对象，`person.name` 不等价于 `proxyPerson.name，与预期不一致。`

### 4. 深度代理

示例：

```javascript
let obj = { name: 'pb', address: { n: 10010 } };
const state = reactive(obj);
effect(() => {
  app.innerHTML = state.address.n;
});
setTimeout(() => {
  state.address.n = 58001; // 只代理了对象的第一层的属性：name、address
}, 1000);
```

解决：
深度递归代理，在`Proxy.get`中，取得的值的类型是对象，使用`reactive`api 继续对取得的值添加响应式。
