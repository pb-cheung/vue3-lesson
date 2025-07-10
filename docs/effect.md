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
- 第 3 层：类型是 Map，引用了属性的 effect 作为键值，effect 的 trackId 作为值。（低版本中是Set，为了方便清理改为了Map）

![vue3依赖的数据结构](./images/vue3-dep-data.webp)



## 依赖清理

也可以叫“依赖重建”

问题：effect.fn中有条件语句，且不同分支中引用的响应式对象属性不同，然后修改属性条件判断发生变化，这种情况如果不做处理，可能会造成依赖冗余，进而出现非预期的表现（effect.fn运行）。

示例：
```javascript
// 依赖清理示例
    let obj = { name: 'pb', age: 30, flag: true };
    let state = reactive(obj);
    effect(() => {
      console.log('effect.fn runner'); // 打印3次
      app.innerHTML = state.flag ? state.name: state.age;
    });
    // 依赖数据结构：{ obj: { flag: {effect}, name: {effect} } }
    setTimeout(() => {
      state.flag = false;

      setTimeout(() => {
        console.log('修改属性后， 不应该触发 effect 重新执行了')
        state.name = 'handsome pb';
      }, 1000); 
      // 更新name，依赖数据中仍然有name，所以effect.fn会运行，这样不合理，因为effect.fn中都没再使用name了，此次运行没有没有意义
    }, 1000);
    // state.flag 变化后，effect.fn运行，dep数据结构更新
    // 依赖数据结构：{ obj: { flag: {effect}, name: {effect}, age: {effect} } }
    // 问题：name不需要依赖收集了，因为不再被使用了
    // 依赖数据结构需要变为：{ obj: { flag: {effect}, age: {effect} } }
```
解决：
  1. 依赖需要重建，重建操作需要在哪个环节开始呢？`effect.fn`运行重新（声明后先运行了一次，创建了依赖关系）运行前，运行过程中`Proxy.get` => `track` => `trackEffect`会再次走创建依赖流程。
  这里具体的重建前置操作就是：“将effect.deps的数组长度即`effect._depsLength`重置为0”。
  2. 清理的实现，我们要解决的问题是同个effect（ActiveEffect实例）上依赖的属性发生了变化，这些属性对应的就是`effect.deps`，我们需要把不再用到的属性的dep移除，`effect.deps`数组更新。更新的策略（diff算法）：是从头开始比对，每次trackEffect中接收一个属性的dep和数组中按照索引升序取到的旧的dep做比对，
      * 如果一致，说明当前属性在两次effect.fn中都有使用到，依赖关系不做修改，`effect._depsLength`自增用于下次比对
      * 如果不一致，说明旧的dep对应的属性不再被当前effect使用了，需要双向清理（依赖关系是双向的，清理重建也是双向的）
        - 新的dep赋值给deps数组当前比对的位置覆盖旧的dep，`effect.deps[effect._depsLength++] = dep;`
        - 旧的dep删除掉effect，`oldDep.delete(effect)`


## 依赖重复收集

问题：一个effect.fn中多次引用了同个属性，造成依赖关系重复添加（dep中set了同个effect(`ReactiveEffect`实例)多次）
