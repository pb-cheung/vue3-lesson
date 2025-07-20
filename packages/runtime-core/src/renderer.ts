import { ShapeFlags } from '@vue/shared';
import { isSameVnode } from './createVnode';

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

    // 第一次初始化的时候，我们把虚拟节点和真实dom创建关联，vnode.el = 真实dom
    // 第二次（后续）渲染新的vnode，可以和上一次的vnode做比对，之后更新对应的el元素，可以后续再复用这个dom元素
    let el = (vnode.el = hostCreateElement(type));

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

  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      // 初始化操作
      mountElement(n2, container);
    } else {
      patchElement(n1, n2, container);
    }
  };
  const patchProps = (oldProps, newProps, el) => {
    // 新的要全部生效
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    for (let key in oldProps) {
      if (!(key in newProps)) {
        //以前有，现在没有，要删除掉
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      unmount(child);
    }
  };
  const patchChildren = (n1, n2, el) => {
    // 儿子节点的情况：text/array/null
    const c1 = n1.children;
    const c2 = n2.children;

    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;

    // 1. 新的是文本，老的是数组，移除老的子节点
    // 2. 新的是文本，老的是文本，内容不同进行替换
    // 3. 老的是数组，新的是数组，全量diff
    // 4. 老的是数组，新的不是数组，移除老的子节点
    // 5. 老的是文本，新的是空
    // 6. 老的是文本，新的是数组

    // 1. + 2.
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }

      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 3. 全量diff算法，两个数组比对
          // TODO: diff
          console.log('diff');
        } else {
          // 4.
          unmountChildren(c1);
        }
      } else {
        // 5.
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '');
        }
        // 6.
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };
  const patchElement = (n1, n2, container) => {
    // 1.比较元素的差异，肯定需要复用dom元素
    // 2.比较属性和元素的子节点
    let el = (n2.el = n1.el); // 对dom元素的复用

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    // hostPatchProp只针对一个属性进行处理，例如class、style、event、attr
    patchProps(oldProps, newProps, el);

    patchChildren(n1, n2, el);
  };
  // 渲染走这里，更新也走这里
  const patch = (n1, n2, container) => {
    if (n1 === n2) {
      // 两次渲染同一个元素直接跳过即可
      return;
    }

    // 直接移除老的dom元素，初始化新的dom元素
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null; // 就会执行后续的n2初始化
    }

    processElement(n1, n2, container); // 对元素（区别于组件）处理
  };

  const unmount = (vnode) => hostRemove(vnode.el);
  // 将虚拟节点变成真实节点进行渲染
  // 多次调用render，会进行虚拟节点的比较，再进行更新
  const render = (vnode, container) => {
    // console.log(
    //   '🚀 ~ file: index.ts ~ line 17 ~ render ~ vnode, container',
    //   vnode,
    //   container
    // );
    if (vnode === null) {
      // 我要移除当前容器中的dom元素
      if (container._vnode) {
        // console.log('🚀 ~ render ~ _vnode:', container._vnode);
        unmount(container._vnode);
      }
    }
    patch(container._vnode || null, vnode, container);
    container._vnode = vnode; // 缓存上一次渲染时候的vnode
  };

  return {
    render,
  };
}
