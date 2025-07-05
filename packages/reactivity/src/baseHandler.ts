import { isObject } from '@vue/shared/src';
import { reactive } from './reactive';
import { track, trigger } from './reactiveEffect';
import { ReactiveFlags } from './constants';

// Proxy 需要搭配 Reflect 来使用
export const mutableHandlers: ProxyHandler<Record<any, any>> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    // 当取值的时候 应该让响应式属性和 effect 映射起来

    // 依赖收集
    track(target, key); // 收集这个对象上的这个属性，和effect关联在一起
    // console.log(activeEffect, key);

    let res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      // 当取的值也是对象的时候，需要对这个对象再进行代理，递归代理，懒代理
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    // 找到属性 让对应的effect更新

    // 触发更新
    let oldValue = target[key as any];
    let result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      // 触发页面更新
      trigger(target, key, value, oldValue);
    }
    return result;
  },
};
