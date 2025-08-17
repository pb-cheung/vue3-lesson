import { getCurrentInstance } from '../component';
import { onMounted, onUpdated } from '../apiLifecycle';
import { ShapeFlags } from '@vue/shared';

export const KeepAlive = {
  __isKeepAlive: true,
  setup(props, { slots }) {
    const keys = new Set(); // 用来记录哪些组件缓存过
    const cache = new Map(); // 缓存表 <keep-alive key="a"><xxx></keep-alive>
    // 在这个组件中，需要一些dom方法，将dom元素移动到一个div中
    // 还可以卸载

    let pendingCacheKey = null;
    const instance = getCurrentInstance();

    const cacheSubTree = () => {
      cache.set(pendingCacheKey, instance.subTree); // 缓存组件的虚拟节点，里面有组件的dom元素
    };
    onMounted(cacheSubTree);
    onUpdated(cacheSubTree);

    return () => {
      const vnode = slots.default();

      const comp = vnode.type;

      const key = vnode.key == null ? comp : vnode.key;
      pendingCacheKey = key;
      const cacheVNode = cache.get(key);
      if (cacheVNode) {
        vnode.component = cacheVNode.component; // 直接复用
        vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE; // 告诉它不要做初始化操作
      } else {
        keys.add(key);
      }
      return vnode; // 等待组件加载完毕后再去缓存
    };
  },
};

export const isKeepAlive = (value) => value.__isKeepAlive;
