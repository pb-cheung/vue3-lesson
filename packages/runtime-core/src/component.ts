import { proxyRefs, reactive } from '@vue/reactivity';
import { hasOwn, isFunction, ShapeFlags } from '@vue/shared';

export function createComponentInstance(vnode) {
  const instance = {
    data: null, // 状态
    vnode, // 组件的虚拟节点
    subTree: null, // 子树
    isMounted: false, // 是否挂载完成
    update: null, // 组件更新的函数
    props: {},
    attrs: {},
    slots: {},
    propsOptions: vnode.type.props, // 用户声明的哪些属性是组件的属性
    component: null,
    proxy: null, // 用来代理props attrs data，让用户更方便的使用
    setupState: {},
  };

  return instance;
}

const initSlots = (instance, children) => {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children;
  } else {
    instance.slots = {};
  }
};

// 初始化属性
const initProps = (instance, rawProps) => {
  const props = {};
  const attrs = {};
  const propsOptions = instance.propsOptions || {}; // 组件中定义的

  if (rawProps) {
    for (let key in rawProps) {
      // 用所有的来分裂
      const value = rawProps[key];
      if (key in propsOptions) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }

  instance.attrs = attrs;
  instance.props = reactive(props); // readonlyReactive，props不需要深度代理，组件内不能改props
};

const publicProperty = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots,
  // ...
};
const handler = {
  get(target, key) {
    // data 和 props属性中的名字不要重名
    const { data, props, setupState } = target;
    // proxy.name -> data.name
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    }

    const getter = publicProperty[key]; // 通过不同的策略来访问对应的方法
    if (getter) {
      return getter(target);
    }
    // 对于一些无法修改的属性：$slots $attrs
  },
  set(target, key, value) {
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (props && hasOwn(props, key)) {
      // 用户可以修改属性中的嵌套属性（内部不会报错）但是不合法
      console.warn('props are readonly');
      return false;
    } else if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value;
    }
    return true;
  },
};
export function setupComponent(instance) {
  const { vnode } = instance;

  // 赋值属性
  initProps(instance, vnode.props);

  initSlots(instance, vnode.children);

  // 赋值代理对象
  instance.proxy = new Proxy(instance, handler);

  const { data, render, setup } = vnode.type;

  if (setup) {
    const setupContext = {
      emit: instance.emit,
      attrs: instance.attrs,
      slots: instance.slots,
      expose: instance.expose,
    };
    const setupResult = setup(instance.proxy, instance.props, setupContext);

    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else {
      instance.setupState = proxyRefs(setupResult); // 将返回值做脱ref
    }
  }

  if (!isFunction(data)) {
    console.warn('data option must be a function');
  } else {
    // data中可以拿到props
    instance.data = reactive(data.call(instance.proxy));
  }

  if (!instance.render) {
    // 避免覆盖setup中的render
    instance.render = render;
  }
}
