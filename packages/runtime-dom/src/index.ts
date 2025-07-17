import { nodeOps } from './nodeOps';
import patchProp from './patchProp';
import { createRenderer } from '@vue/runtime-core';

// 将节点操作和属性操作合并在一起
const renderOptions = Object.assign({ patchProp }, nodeOps);

export { renderOptions };
// render方法采用dom api来进行渲染
export const render = (vnode, container) => {
  return createRenderer(renderOptions).render(vnode, container);
};

export * from '@vue/runtime-core';

// 依赖关系 runtime-dom -> runtime-core -> ractivity
