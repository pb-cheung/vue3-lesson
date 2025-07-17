// 主要是对节点元素的属性操作 class style event

import patchAttr from './modules/patchAttr';
import patchClass from './modules/patchClass'
import patchEvent from './modules/patchEvent';
import patchStyle from './modules/patchStyle';


// diff
export default function patchProp(el, key, preValue, nextValue) {

  if (key === 'class') {
    return patchClass(el, nextValue);
  } else if (key === 'style') {
    return patchStyle(el, preValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    // el.addEventListener(key, nextValue);
    // 绑定事件修改： () => preValue() => () => nextValue()
    // 无需：解绑旧事件+绑定新事件， 提升了性能
    return patchEvent(el, key, nextValue);
  } else { // 普通属性
    patchAttr(el, key, nextValue);
  }
}