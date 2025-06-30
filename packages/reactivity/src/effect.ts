export function effect(fn, options?) {
  // 创建一个响应式effect 数据变化后可以重新执行

  // 创建一个effect， 只要依赖的属性变化了就要执行回调
  const _effect = new ReactiveEffect(fn, () => {
    // scheduler
    _effect.run();
  });
  _effect.run();

  if (options) {
    Object.assign(_effect, options); // 用户传递的（scheduler）覆盖掉
  }
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect; // 可以在润方法上获取到effect的引用
  return runner; // 外界可以自己让其重新run
  // return _effect;
}

export let activeEffect;

function preCleanEffect(effect) {
  effect._depsLength = 0; // 清空上一次的依赖情况
  effect._trackId++; // 记录当前effect执行了几次
}
function postCleanEffect(effect) {
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect); // 删除映射表中的effect
    }
    effect.deps.length = effect._depsLength; // 更新依赖列表的长度，删除effect.deps上的dep。
    // 同样的原理双向记录，删除时候也要双向删除
  }
}
// effectScope.stop(); // 停止所有的effect不参加响应式处理
class ReactiveEffect {
  _trackId = 0; // 用于记录当前effect执行了几次
  _depsLength = 0;
  _runnings = 0; // 是否正在执行

  deps = [];

  public active = true; // 创建的effect是响应式的

  // fn: 用户编写的函数
  // 如果fn中依赖的数据发生变化后，需要重新调用 -> run()
  constructor(public fn, public scheduler) { }
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

      // effect重新执行前，需要将上一次的依赖情况清理 effect.deps清空
      preCleanEffect(this);
      this._runnings++;
      return this.fn(); // （getter函数中）依赖收集（effect中用到的响应式数据，将fn添加为其依赖） -> state.name state.age
    } finally {
      this._runnings--;
      // 依赖收集完成后，清理上一次多余的依赖情况
      // 因为trackEffect中的新旧的比较算法，是按照effect._depsLength作为索引逐个向后比较的，如果新的effect.deps比旧的少，则会导致多余的依赖没有被清理掉
      postCleanEffect(this);
      // activeEffect = undefined; // 依赖收集完成后，重置activeEffect
      activeEffect = lastEffect;
    }
  }
  stop() {
    this.active = false; // 后续来实现
  }
}

function cleanDepEffect(dep, effect) {
  dep.delete(effect);
  if (dep.size === 0) {
    // 如果dep没有了effect，说明这个属性不再被使用了，可以删除掉
    dep.cleanup(); // map为空，则删除这个属性
  }
}

// 双向记忆：
// 1. 依赖树上存储了响应式对象属性和effect的map
// 2. effect上也通过deps数组，存储了

// 总结：
// 1. _trackId用于记录执行次数（防止一个属性在一个effect中多次收集依赖），只收集一次
// 2. 拿到上一次的依赖的最后一个和这次的比较（effect函数重新执行后，重置依赖列表长度，从第一个开始比较）
// {flag, name}
// {flag, age}
export function trackEffect(effect, dep) {
  // console.log("🚀 ~ trackEffect ~ effect, dep:", effect, dep)
  // console.log(dep.get(effect), effect._trackId); // 输出3次：undeinfed 1，这就是dep中避免重复添加effect的判断条件

  // 解决重复收集的问题（一个effect中多次使用了同个属性）
  // 双向收集都要避免这个问题
  // dep添加effect，通过_trackId来判断是否重复收集
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId); // 更新id
    // console.log("🚀 ~ trackEffect 优化了多余的收集")

    // effect方向添加dep过程，通过判断上次的dep是否和当前的dep相同，来避免重复收集
    let oldDep = effect.deps[effect._depsLength]; // 取出上一次的依赖
    if (oldDep !== dep) {
      // 1.没有存过（oldDep=undefined），说明是新的，添加进来。2.如果存过，新旧不一样，则新的dep覆盖旧的
      if (oldDep) {
        // 删除掉老的，属性的dep上删掉effect，删除1
        cleanDepEffect(oldDep, effect);
      }
      // 删除也是双向的，deps中新的覆盖旧的，删除2
      effect.deps[effect._depsLength++] = dep; // 将dep添加到deps
    } else {
      effect._depsLength++; // 说明是重复的，直接增加长度即可
    }
    // console.log("🚀 ~ trackEffect ~ effect.deps:", effect.deps   )
  }

  // dep.set(effect, effect._trackId)
  // // 我还想让effect和dep关联起来
  // effect.deps[effect._depsLength++] = dep;
}
