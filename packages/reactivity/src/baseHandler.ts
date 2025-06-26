import { activeEffect } from './effect'
import { track } from './reactiveEffect'

export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}

// Proxy 需要搭配 Reflect 来使用
export const mutableHandlers: ProxyHandler<Record<any, any>> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    // 当取值的时候 应该让响应式属性和 effect 映射起来

    // TODO:依赖收集

    track(target, key); // 收集这个对象上的这个属性，和effect关联在一起
    // console.log(activeEffect, key);

    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    // 找到属性 让对应的effect更新

    // TODO:触发更新

    return Reflect.set(target, key, value, receiver);
  },
};
