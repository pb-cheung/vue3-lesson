# scheduler

## 概念

官方文档有这个词条：

[调度器（scheduler）](https://cn.vuejs.org/glossary/#scheduler)

> 调度器是 Vue 内部的一部分，它控制着响应式作用运行的时机。
> 当响应式状态发生变化时，Vue 不会立即触发渲染更新。取而代之的是，它会通过队列实现批处理。这确保了即使对底层数据进行了多次更改，组件也只重新渲染一次。
> 侦听器也使用了调度器队列进行批处理。具有 flush: 'pre' (默认值) 的侦听器将在组件渲染之前运行，而具有 flush: 'post' 的侦听器将在组件渲染之后运行。
> 调度器中的任务还用于执行各种其他内部任务，例如触发一些生命周期钩子和更新模板 ref。

它是一个底层的 API，框架普通使用者一般用不到，这里直接讲有点突兀。

## 作用

作用：（提供了一个工具）把副作用合并、改变执行时机（同步/异步/延迟）等操作，避免频繁更新导致性能问题。

### 示例

默认情况下，Vue3 的 effect 会同步执行。

此时每次 count.value 变化，副作用函数都会同步触发。但这种“立即执行”在某些场景下可能不够高效（比如短时间内多次修改依赖，导致副作用反复执行），或者需要自定义执行逻辑（比如延迟执行、合并执行），这时候就需要调度器。

```javascript
import { effect, ref } from 'vue';

const count = ref(0);
effect(() => {
  console.log(`count is: ${count.value}`);
});

count.value = 1; // 立即打印 "count is: 1"
count.value = 2; // 立即打印 "count is: 2"
```

有了 scheduler，我们就可以控制 effect 的执行时机，可以利用时间循环机制，将其改造为异步执行，提升性能。

```javascript
const count = ref(0);
let isScheduling = false;

const runner = effect(
  () => {
    console.log(`最终 count: ${count.value}`);
  },
  {
    scheduler: (job) => {
      if (!isScheduling) {
        isScheduling = true;
        // 使用微任务延迟执行，合并多次修改
        Promise.resolve().then(() => {
          job(); // 执行副作用（等价于 runner()）
          isScheduling = false;
        });
      }
    },
  }
);

// 短时间内多次修改
state.count = 1;
state.count = 2;
state.count = 3;
state.count = 4;
state.count = 5;

// 终端输出位：
// 最终 count: 0 // 刚注册执行一次
// 最终 count: 5 // 所有同步的修改之后，执行一次
```
