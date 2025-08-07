import { currentInstance } from './component';

export function provide(key, value) {
  if (!currentInstance) return; // 建立在组件基础上

  const parentProvide = currentInstance.parent?.provides; // 获取父组件的provide
  let provides = currentInstance.provides;

  if (parentProvide === provides) {
    // 如果在子组件上新增了provides，需要拷贝一份全新的
    provides = currentInstance.provides = Object.create(provides);
  }

  provides[key] = value;
}

export function inject(key, defaultValue) {
  if (!currentInstance) return; // 建立在组件基础上

  const provides = currentInstance.parent?.provides;

  if (provides && key in provides) {
    return provides[key];
  } else {
    return defaultValue;
  }
}
