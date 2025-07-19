// 主要是对节点元素的增删改查

export const nodeOps = {
  // 如果第三个元素不传递，等价于appendChild
  insert: (el, parent, anchor) => parent.insertBefore(el, anchor || null),
  // appendChild parent.insertBefore(el, otherEle)
  remove(el) {
    // 移除dom元素
    const parent = el.parentNode;
    if (parent) {
      parent.removeChild(el);
    }
  },
  createElement: (type) => document.createElement(type),
  createText: (text) => document.createTextNode(text),
  setText: (node, text) => (node.nodeValue = text), // （为文本节点）设置文本
  setElementText: (el, text) => (el.textContent = text),
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling,
};
