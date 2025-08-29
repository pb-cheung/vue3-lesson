import { isFunction, isObject, isString, ShapeFlags } from '@vue/shared';
import { isTeleport } from './components/Teleport';

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');

export function isVnode(value) {
  return value.__is_isVnode;
}

export function isSameVnode(n1, n2) {
  // 标签类型和key都相等，认为是同个vnode
  return n1.type === n2.type && n1.key === n2.key;
}

export function createVnode(type, props, children?, patchFlag?) {
  let shapeFlag;
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT; // DOM元素
  } else if (isTeleport(type)) {
    shapeFlag = ShapeFlags.TELEPORT;
  } else if (isObject(type)) {
    shapeFlag = ShapeFlags.STATEFUL_COMPONENT; // 组件
  } else if (isFunction(type)) {
    shapeFlag = ShapeFlags.FUNCTIONAL_COMPONENT; // 函数式组件
  } else {
    shapeFlag = 0;
  }

  const vnode = {
    __is_isVnode: true,
    type,
    props,
    children,
    key: props?.key, // diff算法需要用到的key
    el: null, // 虚拟节点需要对应的真实节点是谁
    shapeFlag,
    ref: props?.ref,
    patchFlag,
  };

  if (currentBlock && patchFlag > 0) {
    currentBlock.push(vnode);
  }

  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else if (isObject(children)) {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN; // 组件的children是插槽（slots）
    } else {
      children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }

  return vnode;
}

let currentBlock = null;
export function openBlock() {
  currentBlock = []; // 用于收集动态节点
}
export function closeBlock() {
  currentBlock = null;
}
export function setupBlock(vnode) {
  vnode.dynamicChildren = currentBlock; // 当前elementBlock会收集子节点，用当前block来收集
  closeBlock();
  return vnode;
}
// block 有收集虚拟节点的功能
export function createElementBlock(type, props, children?, patchFlag?) {
  return setupBlock(createVnode(type, props, children, patchFlag));
}
export function toDisplayString(value) {
  return isString(value)
    ? value
    : value === null
    ? ''
    : isObject(value)
    ? JSON.stringify(value)
    : String(value);
}

export { createVnode as createElementVNode };

export { createVnode as createVNode };
