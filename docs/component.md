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

[普通 dom 元素渲染更新](data:image/png;base64,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)
