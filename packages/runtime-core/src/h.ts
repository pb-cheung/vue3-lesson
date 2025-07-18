import { isObject } from '@vue/shared';
import { createVnode, isVnode } from './createVnode';

export function h(type, propsOrChildren?, children?) {
  let l = arguments.length;
  if (l === 2) {
    // 第二个参数的情况不确定

    // 是对象且不是数组 => h('h1', 虚拟节点|属性)
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      // 虚拟节点:h('div', h('a'))
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      } else {
        // 属性 h('div', { a: 1 })
        createVnode(type, propsOrChildren);
      }
    }
    // 儿子是：数组|文本
    return createVnode(type, null, propsOrChildren);
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
      return createVnode(type, propsOrChildren, children);
    }
    if (l === 3 && isVnode(children)) {
      children = [children];
    }
    // ===3 | === 1
    return createVnode(type, propsOrChildren, children);
  }
}
