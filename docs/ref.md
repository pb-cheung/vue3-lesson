# ref

## API 介绍

官方文档中，创建响应式状态（为数据添加响应性）有两个 API：`ref`和`reactive`，推荐的是使用`ref`。

- `reactive`只能处理对象类型（对象、数组、Map、Set）
- `ref`可以处理所有类型的数据，原始值（`primitive` value： string、number、boolean）和对象（底层调用 reactive）。

### 语法

`const state = ref(value)`

参数：原始值或对象
返回值：（类`RefImpl`的实例）**对象**，包含唯一属性`value`。
响应式：读取和修改都必须通过`.value`属性`state.value = xxx`；
如果直接修改响应式变量`state = xxx`，那么修改后`state`不再是 RefImpl 实例对象了，变成了一个普通值，不再具有响应式了，因此使用该 api 声明响应式状态要配合使用`const`比较合适。

## 实现

- Vue3 中，为对象类型创建响应式使用`reactive`，底层使用的是`Proxy`，但是`Proxy`不能处理原始值。
- （**ref 实现原理**）Vue3 中，为原始值类型添加响应式必须使用`ref`，原始值不是对象无法直接使用`getter/setter`，`ref`就为其创建一个只有一个`value`属性的对象，并为`value`属性添加`getter/setter`来实现响应式的。

ref 对象（RefImpl 对象）结构伪代码：

```javascript
    {
        _v: false,
        dep,
        get value() {
          // 收集effect
          track();
          return this._v;
        },
        set value(newValue) {
          // 更新effect
          trigger();
          this._v = newValue;
        },
      };
```

### 依赖收集

reactive 处理依赖，是按照层级创建了一个依赖结构树：

```javascript
reactive(targetA);
reactive(targetB);

// 依赖数据结构
// 全局WeakMap
{
    targetA: { // targetMap
        key1: { // dep
            effect: _trackId
        },
        key2: { // dep
            effect: _trackId
        }
    },
    targetB: { // targetMap
        keyx: { // dep
            effect: _trackId
        },
    },
}
```

ref 中的处理于此不同，ref 把依赖直接放到了 RefImpl 对象上（dep 属性），因为 dep 从属于属性，目标是基础值可以理解为只有一个 key。

## 问题

为什么 ref 创建的响应式对象使用上要带个`.value`？而不是像 Vue2 中那样，添加过响应式的变量，正常读取修改。

因为二者实现响应式用的基础 API 不同：

- Vue2 中使用的是`Object.defineProperty`，响应式系统自动回递归遍历`data`选项返回的对象的属性；
