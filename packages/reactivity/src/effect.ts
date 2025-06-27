export function effect(fn, options?) {
  // 创建一个响应式effect 数据变化后可以重新执行

  // 创建一个effect， 只要依赖的属性变化了就要执行回调
  const _effect = new ReactiveEffect(fn, () => {
    // scheduler
    _effect.run();
  });
  _effect.run();

  return _effect;
}

export let activeEffect;
// effectScope.stop(); // 停止所有的effect不参加响应式处理
class ReactiveEffect {
  public active = true; // 创建的effect是响应式的

  // fn: 用户编写的函数
  // 如果fn中依赖的数据发生变化后，需要重新调用 -> run()
  constructor(public fn, public scheduler) { };
  // TypeScript 的语法糖，简化代码。在 Vue 3 或其他现代框架源码中经常能看到这种写法。
  // 在 TypeScript 中，直接通过 public、private、protected 修饰构造函数参数时，会同时完成两个操作：
  // 自动在类实例上声明属性
  // 自动将参数值赋值给实例属性
  // 等效于：
  // constructor(fn, scheduler) {
  //   this.fn = fn;
  //   this.scheduler = scheduler;
  // }

  run() {
    // 让fn执行
    if (!this.active) {
      return this.fn(); // 不是激活的，执行后，什么都不用做
    }
    let lastEffect = activeEffect; // 记住上一层（用堆栈也可以解决）
    try {
      activeEffect = this;
      return this.fn(); // （getter函数中）依赖收集（effect中用到的响应式数据，将fn添加为其依赖） -> state.name state.age
    } finally {
      // activeEffect = undefined; // 依赖收集完成后，重置activeEffect
      activeEffect = lastEffect;
    }
  }
  stop() {
    this.active = false; // 后续来实现
  }
}