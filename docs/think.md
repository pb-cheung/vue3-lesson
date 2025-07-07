# Vue3 设计思想和理念

## 1.声明式框架

命令式和声明式区别

- JQuery 编写的代码是命令式的，命令式框架重要特点是关注过程
- 声明式框架更加关注结果。命令式的代码封装到了 Vuejs 中，过程靠 Vuejs 来实现
  > 声明式代码更加简单，不需要关注实现，按照要求填代码就可以（给上原材料就出结果）

```javascript
let numbers = [2, 3, 4, 5];
// 命令式编程：
let total = 0;
for (let i = 0; i < numbers.length; i++) {
  total += numbers[i];
}
console.log(total);

// 声明式编程：
let total2 = numbers.reduce((memo, current) => {
  return memo + current;
}, 0);
```

## 2.采用虚拟 DOM

## 3.区分编译时和运行时

- 我们需要有一个虚拟 DOM，调用渲染方法将虚拟 DOM 渲染成真实 DOM（缺点就是虚拟 DOM 编写麻烦）
- 专门写个编译时可以将模板编译成虚拟 DOM（在构建的时候进行编译性能更高，不需要在运行的时候进行编译，而且 Vue3 在编译中做了很多优化）

## 4.Vue3 设计思想

- Vue3 注重模块上的拆分，模块之间耦合度低，模块可以独立使用。拆分模块
- 通过构建工具 Tree-shaking 机制实现按需引入，减少用户打包后的体积。组合式 API
- Vue3 允许自定义渲染器，扩展能力强。扩展更方便
- 使用 RFC 来确保改动和设计都是经过 Vuejs 核心团队探讨并得到确认的。也让用户可以了解每一个功能采用或废弃的前因后果。采用 RFC
