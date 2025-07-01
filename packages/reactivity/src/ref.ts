import { activeEffect, trackEffect } from "./effect";
import { toReactive } from "./reactive";
import { createDep, triggerEffects } from "./reactiveEffect";

// reactive shallowReactive
// ref shallowRef
export function ref(value) {
  return createRef(value);
}


export function createRef(value) {
  return new RefImpl(value);
}

class RefImpl {
  public __v_isRef = true; // 增加ref标识
  public _value; // 用来保存ref的值
  public dep; // 用于收集对应的effect

  constructor(public rawValue) {
    this._value = toReactive(rawValue)
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue; // 更新值
      this._value = newValue;
      triggerRefValue(this);
    }
  }
}

function trackRefValue(ref) {
  if (activeEffect) {
    trackEffect(
      activeEffect,
      (ref.dep = createDep(() => (ref.dep = undefined), 'undefined'))
    )
  }
}
function triggerRefValue(ref) {
  let dep = ref.dep;
  if (dep) {
    triggerEffects(dep); // 触发依赖更新
  }
}