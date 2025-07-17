# runtime-core

## 概念

包含的主要 API:

`renderer`: 渲染器（一个角色）
`render`: 渲染（动作），将虚拟节点（vnode）变成真实节点（dom），包含`patch`等过程
`createRenderer`: 创建一个渲染器

### 元素标识

```javascript
export enum ShapeFlags { // 对元素形状的判断
  ELEMENT = 1, // 1
  FUNCTIONAL_COMPONENT = 1 << 1, // 2 函数式组件
  STATEFUL_COMPONENT = 1 << 2, // 4
  TEXT_CHILDREN = 1 << 3, // 8
  ARRAY_CHILDREN = 1 << 4, // 16
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}
```

使用位运算`bitmask`来标识状态：用二进制的每一位来标识一种状态，有很多优点：

- 存储高效，可以任意两个多个组合（或`|`运算），且不会有歧义
- 判断极快，使用与运算`&`，即可判断是否包含某个状态，举例 `9 & ShapeFlags.TEXT_CHILDREN`，结果为 1，大于 0（8 & 1 = 9），flag 值 9 说明包含 8 状态（还包含 1 状态）。

类似于类 Unix 系统中的权限，r-读-4，w-写-2，x-访问-1，可以任意组合得到的数字表示一种权限状态且不会有歧义。

```bash
# 所有者可读写，组和其他人只读（rw-r--r--）
chmod 644 filename
```
