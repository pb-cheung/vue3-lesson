import { isString, ShapeFlags } from '@vue/shared';

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');

export function isVnode(value) {
  return value.__is_isVnode;
}

export function isSameVnode(n1, n2) {
  // 标签类型和key都相等，认为是同个vnode
  return n1.type === n2.type && n1.key === n2.key;
}

export function createVnode(type, props, children?) {
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
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
