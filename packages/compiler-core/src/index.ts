// 编译主要分为三步：
// 1. 解析阶段：将模板字符串解析成 AST（抽象语法树）
// 2. 转换阶段：对 AST 进行优化和转换，生成codegennode
// 3. 生成阶段：生成渲染函数

import { NodeTypes } from './ast';
import { parse } from './parser';
import { TO_DISPLAY_STRING } from './runtime-helpers';

// DOM的遍历方式: 先序、中序、后序
// 元素 -> 文本 -> 文本处理后 -> 元素处理后。顺序像类似洋葱结构，为什么会这样因为挂载是从子层开始
function transformElement(node, context) {
  if (NodeTypes.ELEMENT === node.type) {
    console.log('处理元素', node);

    return function () {
      console.log('文本处理后触发');
    };
  }
}

function transformText(node, context) {
  if (NodeTypes.ELEMENT === node.type || NodeTypes.ROOT === node.type) {
    console.log(node, '元素中含有文本');

    return function () {
      console.log(node, ' 文本处理后执行');
    };
  }
}

function transformExpression(node, context) {
  if (NodeTypes.INTERPOLATION === node.type) {
    // console.log(node, '表达式');
    node.content.content = `_ctx.${node.content.content}`;
  }
}

function createTransformContext(root) {
  return {
    currentNode: root,
    parent: null,

    // createElementVnode createTextVnode toDisplayString
    transformNode: [transformElement, transformText, transformExpression],
    helpers: new Map(),
    helper(name) {
      if (!this.helpers.has(name)) {
        const count = this.helpers.size + 1;
        this.helpers.set(name, count);
      }
      return this.helpers.get(name);
    },
  };
}

function traverseNode(node, context) {
  context.currentNode = node;
  const transforms = context.transformNode;

  const exists = []; // 元素的函数、文本的函数、表达式的函数
  for (let i = 0; i < transforms.length; i++) {
    let exit = transforms[i](node, context);
    if (exit) {
      exists.push(exit);
    }
  }

  switch (node.type) {
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      for (let i = 0; i < node.children.length; i++) {
        context.parent = node;
        traverseNode(node.children[i], context);
      }
      break;
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
  }
  context.currentNode = node; // 因为traverseNode会将node变成子节点
  let i = exists.length;
  if (i > 0) {
    while (i--) {
      exists[i]();
    }
  }
}

function transform(ast) {
  // 对 AST 进行优化和转换，生成 codegen node
  // babel babel-traverse

  const context = createTransformContext(ast);

  traverseNode(ast, context);
  (ast as any).helpers = [...context.helpers.keys()];
}

function compile(template) {
  const ast = parse(template);
  console.log('🚀 ~ file: index.ts ~ line 59 ~ compile ~ ast', ast);

  // 进行代码的转化
  transform(ast);
}

export { compile, parse };
