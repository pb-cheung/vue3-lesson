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

### activeEffect

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
