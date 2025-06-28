import { activeEffect, trackEffect } from "./effect";

const targetMap = new WeakMap(); // 存放依赖收集的关系

export function createDep(cleanup, key) {
  const dep = new Map() as any;
  dep.cleanup = cleanup;
  dep.name = key; // 自定义的，为了标识这个映射表是给哪个属性服务的
  return dep;
}

export function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);

    if (!depsMap) { // 新增的
      targetMap.set(target, (depsMap = new Map()))
    }

    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = createDep(() => depsMap.delete(key), key)); // 后面用于清理不需要的属性
    }


    trackEffect(activeEffect, dep); // 将当前的effect放入到dep（映射表）中，后续可以根据值的变化触发此dep中存放的effect
    console.log("🚀 ", targetMap)
  }
  // activeEffect 有这个属性 说明这个key是在effect中访问的，
  // 没有说明在effect之外访问的不用进行说明
}

export function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);

  if (!depsMap) { // 找不到对象 直接return即可
    return
  }
  let dep = depsMap.get(key);
  if (dep) {
    // 修改的属性对应的effect
    triggerEffects(dep);
  }
}
function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (effect.scheduler) {
      effect.scheduler(); // effect.run();
    };
  }
}