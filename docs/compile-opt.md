# 编译优化

## 靶向更新

Vue 中更新（patch）的大概过程：`patch` -> `patchElement` -> `patchChildren`中一层层遍历比较新旧两个 vnode。

我们的渲染内容（模板）中可能大部分内容都是静态的，没有绑定响应式变量，更新的时候也不会变动。

**靶向更新**就是在模板编译（生成 render 函数）的过程中，**标记**模板中**动态**的内容，例如插值`{{}}`，然后在更新的时候，直接处理这些标记的内容，省去逐层遍历比对进行 patch。

我们这里实现的是靶向更新的第 2 步：运行已经标记了动态内容的 render 函数，优化更新过程。

第 1 步，我们使用工具[Vue3 Template Explorer](https://template-explorer.vuejs.org/)来解决，这个在线工具可以将标签模板转换成 render 函数，这些 render 函数中已经进行了动态内容标记。

```html
<div>
  <h1>Hello! pb</h1>
  <span>{{ name }}</span>
</div>
```

以上模板被编译成的 render 函数：

```javascript
import {
  createElementVNode as _createElementVNode,
  toDisplayString as _toDisplayString,
  openBlock as _openBlock,
  createElementBlock as _createElementBlock,
} from 'vue';

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (
    _openBlock(),
    _createElementBlock('div', null, [
      _createElementVNode('h1', null, 'Hello! pb'),
      _createElementVNode(
        'span',
        null,
        _toDisplayString(_ctx.name),
        1 /* TEXT */
      ),
    ])
  );
}
```

`_createElementVNode`函数最后一个参数就是动态内容标记，代码实现中有一个枚举类型（`PatchFlags`）对应此，1 表示的是动态文本内容。

分析以上代码，实现几个函数：

- `_createElementVNode`创建 vnode 函数重命名即可
- `_toDisplayString`类型转换或者 json 序列化，
- `_openBlock`，return 的是 vnode，打印后可以看到动态内容被放入到了一个名称为`dynamicChildren`的数组中，此函数的功能就是初始化一个暂存数组`currentBlock`。然后在创建虚拟函数中将`patchFlag>0`的 vnode 添加到暂存数组`currentBlock`，最终挂到 vnode 的`dynamicChildren`属性上。
- `_createElementBlock`，return 的是一个逗号运算符表达式，它从左到右一次执行所有表达式，最终返回的是最后一个表达式的值。所以此函数返回 vnode。它的内容就是创建 vnode（遍历子节点标记动态内容放到暂存数组），暂存数组`currentBlock`同步到`dynamicChildren`，关闭暂存数组。

然后是 patch 过程中使用`patchElement`中，从 vnode 中获得的`patchFlag`或`dynamicChildren`不为空，就可以使用循环遍历动态内容，进行更新，而不走层级遍历更新的`patchChildren`过程。

## BlockTree

block 只能收集优化动态节点（文本、属性）更新，虚拟 DOM 树层级的变动处理不了，引入 BlockTree 来解决。

BlockTree 就是将不稳定的结构也作为 block 来进行处理。

```html
<div>
  <p v-if="flag">
    <span>{{a}}</span>
  </p>
  <div v-else>
    <span>{{a}}</span>
  </div>
</div>
```

不稳定的结构：DOM 树可能发生变化（`v-if/v-for/Fragment`）

```javascript
export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (
    _openBlock(),
    _createElementBlock('div', null, [
      _ctx.flag
        ? (_openBlock(),
          _createElementBlock('p', { key: 0 }, [
            _createElementVNode(
              'span',
              null,
              _toDisplayString(_ctx.a),
              1 /* TEXT */
            ),
          ]))
        : (_openBlock(),
          _createElementBlock('div', { key: 1 }, [
            _createElementVNode(
              'span',
              null,
              _toDisplayString(_ctx.a),
              1 /* TEXT */
            ),
          ])),
    ])
  );
}
```

观察以上 render 函数代码，可以看到第二层动态的结构 div 和 p 也开启了一个 block，这种 block 嵌套就是 BlockTree。
打印返回值 vnode，也可以看到根 div 对应的 vnode 中有`dynamicChildren`，数组元素是 p 对应的 vnode。

`v-for`的处理比较特殊，把循环节点包裹在一个`Fragment`中，整体作为一个 block，放入`dynamicChildren`，因为遍历的数组可能前后数量变化，数量不一致做不到靶向。

```html
<div>
  <span>Hello</span>
  <div v-for="item in list">{{item}}</div>
</div>
```

```javascript
export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (
    _openBlock(),
    _createElementBlock('div', null, [
      _createElementVNode('span', null, 'Hello'),
      (_openBlock(true),
      _createElementBlock(
        _Fragment,
        null,
        _renderList(_ctx.list, (item) => {
          return (
            _openBlock(),
            _createElementBlock(
              'div',
              null,
              _toDisplayString(item),
              1 /* TEXT */
            )
          );
        }),
        256 /* UNKEYED_FRAGMENT */
      )),
    ])
  );
}
```

## 静态提升

静态的节点(节点内容、属性、样式)都不会变化的，通过静态提升`hoistStatic`，提升到全局，更新的时候直接使用，省去了创建 vnode 的成本。

## 预字符串化

静态提升的更进一步，如果有连续 20 个相同的静态节点，会将静态节点序列化为字符串。

## 缓存函数

Vue3 Template Explorer 中右上角 Options 打开，开启`cacheHandlers`

将节点上的绑定事件，添加到缓存数组中。
