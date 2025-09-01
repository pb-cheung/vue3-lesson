// 编译主要分为三步：
// 1. 解析阶段：将模板字符串解析成 AST（抽象语法树）
// 2. 转换阶段：对 AST 进行优化和转换，生成codegennode
// 3. 生成阶段：生成渲染函数
import { NodeTypes } from './ast';
// 将模板转换成AST语法树
function compile() {}

function createParserContext(content) {
  return {
    originalSource: content,
    source: content, // 字符串会不停地减少
    line: 1,
    column: 1,
    offset: 0,
  };
}
function isEnd(context) {
  return context.source.length === 0;
}
function advanceBy(context, endIndex) {
  let c = context.source;
  context.source = c.slice(endIndex);
}
function parseTextData(context, endIndex) {
  const content = context.source.slice(0, endIndex);
  advanceBy(context, endIndex);
  return content;
}
function parseText(context) {
  let tokens = ['<', '{{']; // 找当前离得最近的词法
  let endIndex = context.source.length; // 先假设找不到
  for (let i = 0; i < tokens.length; i++) {
    const index = context.source.indexOf(tokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  // 0 - endIndex 为文字内容
  const content = parseTextData(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content,
  };
}
function parseChildren(context) {
  const nodes = [];
  while (!isEnd(context)) {
    const c = context.source;
    let node;
    if (c.startsWith('{{')) {
      // 插值
      node = '表达式';
    } else if (c[0] === '<') {
      // 标签，<div>
      node = '元素';
    } else {
      // 文本  文本可能的格式：abc {{name}}，abc <div></div>
      // 离大括号近还是标签近
      node = parseText(context);
    }

    if (node) {
      // 状态机
      nodes.push(node);
    }
  }
  return nodes;
}
function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
  };
}
function parse(template) {
  // 根据template 产生一棵树 line column offset

  const context = createParserContext(template);
  // <p><div></div><div></div></p>
  // 转换后：{type:1, tag: 'p', children: [ {type:1, tag: 'div'}, {type:1, tag: 'div'} ]}
  return createRoot(parseChildren(context));
}

export { compile, parse };
