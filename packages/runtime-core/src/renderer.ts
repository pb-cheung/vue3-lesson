import { ShapeFlags } from '@vue/shared';

// 完全不关心api层面的，可以跨平台
export function createRenderer(renderOptions) {
  // core中不关心如何渲染

  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = renderOptions;

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      // children[i] 可能是纯文本元素
      patch(null, children[i], container);
    }
  };

  const mountElement = (vnode, container) => {
    const { type, children, props, shapeFlag } = vnode;

    let el = hostCreateElement(type);

    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 1 + 8 = 9
    // 1 | 8 = 9 或 组合
    // 9 & 8 > 0 说明是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }

    hostInsert(el, container);
    // hostCreateElement(vnode)
  };
  // 渲染走这里，更新也走这里
  const patch = (n1, n2, container) => {
    if (n1 === n2) {
      // 两次渲染同一个元素直接跳过即可
      return;
    }

    if (n1 === null) {
      // 初始化操作
      mountElement(n2, container);
    }
  };

  // 将虚拟节点变成真实节点进行渲染
  // 多次调用render，会进行虚拟节点的比较，再进行更新
  const render = (vnode, container) => {
    console.log(
      '🚀 ~ file: index.ts ~ line 17 ~ render ~ vnode, container',
      vnode,
      container
    );
    patch(container._vnode || null, vnode, container);
    container._vnode = vnode; // 缓存上一次渲染时候的vnode
  };

  return {
    render,
  };
}
