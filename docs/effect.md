# effect

## API 介绍

**effect**，官方文档中没有，早期也没对外暴露，这个 api 的使用方法和`watchEffect`一致。

- `effect`第一个参数为函数，我们称其为`fn`
- `effect`函数调用完成，`fn`立即运行一次
- `fn`中用到的响应式数据发生了变化，`fn`再运行一次

```javascript
let obj = { name: 'pb', age: 30 };
let state = reactive(obj);
effect(() => {
  console.log(state.age);
});
setTimeout(() => {
  state.age++;
}, 1000);
```

## 实现要点

### ReactiveEffect 类

### effect 嵌套调用

```javascript
effect(() => {
  console.log('f1 ', state.name);

  effect(() => {
    console.log('f2 ', state.name);
  });

  console.log(state.age);
});
```

问题：不做处理的情况下，运行至`console.log(state.age);`这一行，其对应的活跃 effect（activeEffect）是`f2._effect`，是不对的，出现依赖搜集错误。

解决：
利用 js**执行上下文栈**特性，`activeEffect`在全局执行上下文中;
每次`_effect.run`，创建新的执行上下文栈，栈内的`lastEffect`存储`activeEffect`;
修改`activeEffect`为当前`effect`,`fn`运行完之后再使用`lastEffect`保存的重置。

一个全局变量`activeEffect`来保存当前正在运行的 `fn` 所对应的 effect(`ReactiveEffect`实例)

```bash
f1 effect运行
lastEffect = undefined, activeEffect = f1.effect
f1.fn()
    // log: f1 pb
    遇到f2 effect 运行
    lastEffect = f1.effect, activeEffect = f2.effect
    f2.fn()
      // log: f2 pb
    f2.fn运行结束，activeEffect = f1.effect
    // log: 30
    f1.fn运行结束，activeEffect = undefined
```

![effect 循环调用，activeEffect 处理过程](./images/effect-nested-call.webp)

## 依赖

数据结构：`WeakMap` + `Map`。

- 创建了应用内唯一的`WeakMap`存储依赖关系，依赖关系是树状的（根节点 WeakMap，第 1 层节点响应式对象，第 2 层响应式对象的各个属性，第 3 层...）
- 第 1 层：响应式对象本身作为键值，创建一个 Map 作为值，放入 WeakMap。
- 第 2 层：类型是 Map，对象属性作为键值，dep 作为值（dep 也是一个 Map）。
- 第 3 层：类型是 Map，引用了属性的 effect 作为键值，effect 的 trackId 作为值。

![vue3依赖的数据结构](./images/vue3-dep-data.webp)
