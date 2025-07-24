import { ShapeFlags } from '@vue/shared';
import { Fragment, isSameVnode, Text } from './createVnode';
import getSequence from './seq';

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

  const mountElement = (vnode, container, anchor) => {
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

    hostInsert(el, container, anchor);
    // hostCreateElement(vnode)
  };
  const processText = (n1, n2, container) => {
    if (n1 === null) {
      // 1. 虚拟节点关联真实节点
      // 2. 将节点插入到页面
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      const el = (n2.el = n1.el);
      if (n1.children === n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      // 初始化操作
      mountElement(n2, container, anchor);
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

  const patchKeyedChildren = (c1, c2, el) => {
    // 比较两个儿子的差异，更新el
    // 常用到的api：appendChild、removeChild、insertBefore
    // [a,b,c,e,f,d]
    // [a,b,d,q,f,d]

    // 1. 减少比对范围，先从头开始比，再从尾部开始比较，确定不一样的范围
    // 2. 从头比对，再从尾比对，如果有多余的或者新增的直接操作即可

    // a/b/c
    // a/b/d/e
    let i = 0; // 开始比对的索引
    let e1 = c1.length - 1; // 第一个数组的尾部索引 e = end
    let e2 = c2.length - 1; // 第二个数组的尾部索引

    // 从头部比较
    while (i <= e1 && i <= e2) {
      // 有任何一方循环结束了，就要终止比比较
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el); // 更新当前节点的属性和儿子（递归比较子节点）
      } else {
        break;
      }
      i++;
    }

    // [a/b/c]
    // [d/e/b/c]
    // 从尾部比较
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // 处理增加和删除的特殊情况：[a,b,c] [a,b] | [c,a,b] [a,b]

    // [a,b] [a,b,c] -> i = 2, e1 = 1, e2 = 2 -> i > e1 && i <= e2
    // [a,b] [c,a,b] -> i = 0, e1 = -1, e2 = 0 -> i > e1 && i <= e2
    if (i > e1) {
      // 新的多
      if (i <= e2) {
        // 有插入的部分
        const nextPos = e2 + 1; // 看一下当前元素下一个元素是否存在

        let anchor = c2[nextPos]?.el;
        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 老的多
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]); // 将元素一个个删除
          i++;
        }
      }
    }

    // 以上确认不变化的节点，并且对插入和移除做了处理

    // 后面就是特殊的比对方式了
    // console.log(i, e1, e2);
    let s1 = i;
    let s2 = i;

    // 做一个映射表用于快速查找，看老的是否在新的里面，没有就删除，有的话就更新
    const keyToNewIndexMap = new Map();
    let toBePatched = e2 - s2 + 1; // 要倒序插入的个数

    // 待处理的新的节点列表，他们对应的老节点的列表的索引
    let newIndexToOldMapIndex = new Array(toBePatched).fill(0); // [0,0,0,0]

    // [4,2,3,0] -> [1,2] 根据最长递增子序列算法得出对应的索引结果

    for (let i = s2; i <= e2; i++) {
      const vnode = c2[i];
      keyToNewIndexMap.set(vnode.key, i);
    }
    for (let i = s1; i <= e1; i++) {
      const vnode = c1[i];
      const newIndex = keyToNewIndexMap.get(vnode.key); // 通过key找索引
      if (newIndex == undefined) {
        // 如果新的里面找不到则说明老的有的要删除
        unmount(vnode);
      } else {
        newIndexToOldMapIndex[newIndex - s2] = i;
        // 比较前后节点的差异，更新属性和儿子
        patch(vnode, c2[newIndex], el);
      }
    }
    // console.log('newIndexToOldMapIndex: ', newIndexToOldMapIndex); // [4,2,3,0] 待处理的几个元素在旧数组中的下标

    let increasingSeq = getSequence(newIndexToOldMapIndex);
    let j = increasingSeq[increasingSeq.length - 1]; // 索引

    // 调整顺序
    // 我们可以按照新的队列，倒序插入，insertBefore 通过参照物往前面插入

    // 插入的过程中，可能新的元素多，需要创建
    for (let i = toBePatched - 1; i >= 0; i--) {
      let newIndex = s2 + i; // h节点（教程上的示例）对应的索引，找它的下一个元素作为参照物，来进行插入
      let anchor = c2[newIndex + 1]?.el;
      let vnode = c2[newIndex];
      if (!vnode.el) {
        // 新列表中新增的元素
        patch(null, vnode, el, anchor); // 创建h插入
      } else {
        if (i === increasingSeq[j]) {
          j--; // 做了diff算法的优化
        } else {
          hostInsert(vnode.el, el, anchor); // 接着倒序插入
        }
      }
      // 倒序比对每一个元素，做插入操作
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
          patchKeyedChildren(c1, c2, el);
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
  const processFragment = (n1, n2, container) => {
    if (n1 === null) {
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container);
    }
  };
  // 渲染走这里，更新也走这里
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) {
      // 两次渲染同一个元素直接跳过即可
      return;
    }

    // 直接移除老的dom元素，初始化新的dom元素
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null; // 就会执行后续的n2初始化
    }

    const { type } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        processElement(n1, n2, container, anchor); // 对元素（区别于组件）处理
    }
  };

  const unmount = (vnode) => {
    if (vnode.type === Fragment) {
      unmountChildren(vnode.children);
    } else {
      hostRemove(vnode.el);
    }
  };
  // 将虚拟节点变成真实节点进行渲染
  // 多次调用render，会进行虚拟节点的比较，再进行更新
  const render = (vnode, container) => {
    if (vnode === null) {
      // 我要移除当前容器中的dom元素
      if (container._vnode) {
        // console.log('🚀 ~ render ~ _vnode:', container._vnode);
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
      container._vnode = vnode; // 缓存上一次渲染时候的vnode
    }
  };

  return {
    render,
  };
}
