import { isFunction, isObject } from '@vue/shared';
import { ReactiveEffect } from './effect';
import { isReactive } from './reactive';
import { isRef } from './ref';

export function watch(source, cb, options = {} as any) {
  // watchEffect 也是基于doWatch来实现的
  return doWatch(source, cb, options);
}

export function watchEffect(source, options = {}) {
  // 没有cb的情况，就是watchEffect
  return doWatch(source, null, options as any);
}

function traverse(source, depth, currentDepth = 0, seen = new Set()) {
  // 如果是基础类型，直接返回
  if (!isObject(source)) {
    return source;
  }
  if (depth) {
    if (currentDepth >= depth) {
      // 高层的深度值小，递归是从高层到低层
      // 随着遍历进行，当前深度值currentDepth变大
      // 大于等于传参设置的监听深度值depth，则遍历到头了
      return source;
    }
    currentDepth++; // 根据deep属性来看是否深度
  }
  if (seen.has(source)) {
    return source;
  }
  for (let key in source) {
    traverse(source[key], depth, currentDepth, seen);
    seen.add(source);
  }
  return source; // 遍历就会触发每个属性的getter
}
function doWatch(source, cb, { deep, immediate }) {
  const reactiveGetter = (source) =>
    traverse(source, deep === false ? 1 : undefined);

  // 产生一个可以给ReactiveEffect使用的getter，需要对这个对象进行取值操作，会关联当前的reactiveEffect
  let getter;
  if (isReactive(source)) {
    getter = () => reactiveGetter(source);
  } else if (isRef(source)) {
    getter = () => source.value;
  } else if (isFunction(source)) {
    getter = source;
  }
  let oldValue;
  const job = () => {
    if (cb) {
      const newValue = effect.run();
      cb(newValue, oldValue);
      oldValue = newValue;
    } else {
      effect.run();
    }
  };
  const effect = new ReactiveEffect(getter, job);
  if (cb) {
    if (immediate) {
      // 立即先执行一次回调，传递新值和老值
      job();
    } else {
      oldValue = effect.run();
    }
  } else {
    // watchEffect
    effect.run(); // 直接执行即可
  }
}
