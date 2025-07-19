import { ShapeFlags } from '@vue/shared';

export function createVnode(type, props, children?) {
  const shapeFlag = type;
  const vnode = {
    __is_isVnode: true,
    type,
    props,
    children,
    key: props?.key, // diff算法需要用到的key
    el: null, // 虚拟节点需要对应的真实节点是谁
    shapeFlag,
  };

  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }

  return vnode;
}

export function isVnode(value) {
  return value.__is_isVnode;
}

export function isSameVnode(n1, n2) {
  // 标签类型和key都相等，认为是同个vnode
  return n1.type === n2.type && n1.key === n2.key;
}
