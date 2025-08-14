# component

## 概念

虚拟节点 ≈ virtual DOM ≈ vdom ≈ vnode

挂载（mount）：把虚拟节点渲染成真实 DOM 节点并挂载到 DOM 树上的过程。

打补丁（patch）：虚拟节点变化后，新旧 vnode 对比后，找到最小变化并更新对应 DOM 节点的过程。

mount 可以算作一种特殊的 patch（旧的 vnode 不存在）情况。

## 渲染函数

渲染函数 render，接收 vnode 参数，并将其渲染成真实的 DOM 元素。h 函数接收组件定义，将其渲染成 vnode。

这课程讲解，从渲染函数`h`的方式来渲染组件展开，一步步实现组件渲染功能。

官方示例，组件对象作为第一个参数传给`h`函数来渲染：

```javascript
import Foo from './Foo.vue';
import Bar from './Bar.jsx';

function render() {
  return ok.value ? h(Foo) : h(Bar);
}
```

来自：[渲染函数&JSX|组件](https://cn.vuejs.org/guide/extras/render-function#components)

## 实现

### 虚拟节点

`h` -> `createVnode`

h 函数支持接收组件对象，底层创建 vnode 也要支持，判断第一个参数`type`是对象即认为是组件定义，为`shapeFlag`标识赋对应的值。

```javascript
// createVnode.ts
const shapeFlag = isString(type)
  ? ShapeFlags.ELEMENT // DOM元素
  : isObject(type)
  ? ShapeFlags.STATEFUL_COMPONENT // 组件
  : 0;
```

### 渲染

`入口render` -> `patch` -> `processComponent` -> `mountComponent` -> `subTree = 组件的render()` -> `patch(subTree)`

上图的这个`render`不是组件对象中的 render，是入口 render 或者是组件父级的 render。

patch 函数中根据 vnode 类型和标识（`type`+`shapeFlag`） 进行分支处理（switch-case），新建组件对应的分支，创建对应的处理函数`processComponent`和挂载函数`mountComponent`。

**挂载**操作做的就是：调用 patch 函数，传入组件内容的 vnode，创建真实的 dom。

获取`组件内容的vnode`，即组件 render 函数的返回值，然后调用 patch 渲染：

```javascript
const { render } = vnode.type; // 组件具体的定义在组件vnode的type上（h函数的第一个参数为type）
const subTree = render.call(); // subTree子树是组件内容的vnode
patch(null, subTree, container); // 渲染组件内容对应的dom
```

教程调试示例：

```javascript
// 选项式组件
const VueComponent = {
  data() {
    return {
      name: 'pb',
      age: 30,
    };
  },
  render(proxy) {
    // this === 组件的实例
    return h(Fragment, [
      h(Text, 'my name is: ' + proxy.name),
      h('a', this.age),
    ]);
  },
};
// 组件两个虚拟节点组成
// h(VueComponent) = vnode 产生的组件内的虚拟节点
// render函数返回的虚拟节点，这个才是最终要渲染的内容 = subTree
render(h(VueComponent), app);
```

### props&attrs

attrs = 所有属性 - props

#### props

props 是特殊的 attribute，在组件中声明式（props）或者函数式（defineProps）明确定义的属性 attribute。

#### attrs&$attrs

引用官网文档中的相关描述，厘清概念规则：

[透传 Attributes](https://cn.vuejs.org/guide/components/attrs.html#fallthrough-attributes)

> “透传 attribute”指的是传递给一个组件，却没有被该组件声明为 props 或 emits 的 attribute 或者 v-on 事件监听器。最常见的例子就是 class、style 和 id。当一个组件以单个元素为根作渲染时，透传的 attribute 会自动被添加到根元素上。

> 这些透传进来的 attribute 可以在模板的表达式中直接用 `$attrs` 访问到。

> 这个 $attrs 对象包含了除组件所声明的 props 和 emits 之外的所有其他 attribute，例如 class，style，v-on 监听器等等。

[Setup 上下文](https://cn.vuejs.org/api/composition-api-setup.html#setup-context)中的`attrs`

```javascript
export default {
  setup(props, { attrs, slots, emit, expose }) {
    ...
  }
}
```

> `attrs` 和 slots 都是**有状态的**对象，它们总是会随着组件自身的更新而更新。此外还需注意，和 props 不同，attrs 和 slots 的属性都**不是响应式的**。如果你想要基于 attrs 或 slots 的改变来执行副作用，那么你应该在 onBeforeUpdate 生命周期钩子中编写相关逻辑。

[组件实例](https://cn.vuejs.org/api/component-instance.html)中包含`$attrs`

> 若是单一根节点组件，$attrs 中的所有属性都是直接自动继承自组件的根元素。而多根节点组件则不会如此

[渲染选项-render](https://cn.vuejs.org/api/options-rendering.html#render)

> 用于编程式地创建组件虚拟 DOM 树的函数。

从这里的接口类型信息中可以知道，render 函数中的`this`指向和其参数相同为**组件实例**。
所以，在函数中可以这样使用：`this.$attrs`、`$this.$props`

综合示例：

```javascript
const VueComponent = {
  props: {
    name: String,
    age: Number,
  },
  data() {
    return {
      x: 'xxx',
      y: 'yyy',
    };
  },
  render(proxy) {
    console.log('🚀 proxy', proxy);
    // attrs: { a: 1, b: 2 }
    // props: { name: 'pb', age: 30 }
    // data: { x: 'xxx', y: 'yyy' }
    return h('div', [
      h(Text, 'my name is: ' + proxy.name),
      h('a', this.age),
      h('div', this.x + this.y),
      h('div', this.$attrs.a),
      h('div', this.$attrs.b),
    ]);
  },
};
render(h(VueComponent, { a: 1, b: 2, name: 'pb', age: 30 }), app);
```
