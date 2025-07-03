import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandler";
import { ReactiveFlags } from './contants'

// 用于记录我们的代理后的结果，可以复用（同一个对象代理多次还是得到的同个（proxy）对象）
const reactiveMap = new WeakMap(); // WeakMap防止内存泄漏？

export function reactive(target) {
  return createReactiveObject(target);
}
export function shallowReactive(target) { }

function createReactiveObject(target) {
  // 统一判读，响应式对象必须是对象才可以
  if (!isObject(target)) {
    return target;
  }

  // 解决代理过的对象再次被代理：判断是否有get方法
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  // 解决重复代理：取缓存，如果有直接返回
  const existsProxy = reactiveMap.get(target);
  if (existsProxy) {
    return existsProxy;
  }
  let proxy = new Proxy(target, mutableHandlers);
  // 根据对象缓存代理后的结果
  reactiveMap.set(target, proxy);
  return proxy;
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}