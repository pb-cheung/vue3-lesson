import { activeEffect } from "./effect";

export function track(target, key) {
  if (activeEffect) {
    console.log(key, activeEffect)
  }
  // activeEffect 有这个属性 说明这个key是在effect中访问的，
  // 没有说明在effect之外访问的不用进行说明
}

