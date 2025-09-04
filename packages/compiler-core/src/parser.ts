import { NodeTypes } from './ast';
// 将模板转换成AST语法树

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
  const c = context.source;
  if (c.startsWith('</')) {
    // 如果是闭合标签也要停止循环
    return true;
  }
  return !c;
}
function advancePositionMutation(context, c, endIndex) {
  let linesCount = 0; // 第几行
  let linePos = -1; // 换行的位置信息

  for (let i = 0; i < endIndex; i++) {
    if (c.charCodeAt(i) === 10) {
      // 字符码 10 对应的是换行符 \n
      linesCount++;
      linePos = i;
    }
  }
  context.offset += endIndex;
  context.line += linesCount;
  context.column =
    linePos === -1 ? context.column + endIndex : endIndex - linePos;
}
function advanceBy(context, endIndex) {
  let c = context.source;
  // 需要在这里更新位置信息
  advancePositionMutation(context, c, endIndex);
  context.source = c.slice(endIndex);
}
function parseTextData(context, endIndex) {
  const content = context.source.slice(0, endIndex);
  advanceBy(context, endIndex);
  return content;
}
const getCursor = (context) => {
  const { line, column, offset } = context;
  return {
    line,
    column,
    offset,
  };
};
function parseInterpolation(context) {
  const start = getCursor(context);
  advanceBy(context, 2); // 跳过 {{
  const content = parseTextData(context, context.source.indexOf('}}'));
  advanceBy(context, 2); // 跳过 }}
  return {
    type: NodeTypes.INTERPOLATION,
    content,
    loc: getSelection(context, start),
  };
}
function parseText(context) {
  const start = getCursor(context);

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
    loc: getSelection(context, start),
  };
}

const getSelection = (context, start, e?) => {
  return {
    start: {
      line: start.line,
      column: start.column,
      offset: start.offset,
    },
    end: {
      line: context.line,
      column: context.column,
      offset: context.offset,
    },
    source: context.originalSource.slice(start.offset, context.offset),
  };
};

function advanceSpaces(context) {
  const match = /^\s+/.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length);
  }
}
function parseAttributeValue(context) {
  const quote = context.source[0];
  const isQuoted = quote === '"' || quote === "'";
  let content;

  if (isQuoted) {
    advanceBy(context, 1);
    const endIndex = context.source.indexOf(quote, 1);
    content = parseTextData(context, endIndex);
    advanceBy(context, 1);
  } else {
    content = context.source.match(/([^\s/>])+/)[1];
    advanceBy(context, content.length);
    advanceSpaces(context);
  }

  return content;
}
function parseAttribute(context) {
  const start = getCursor(context);

  let match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  const name = match[0];
  let value;
  advanceBy(context, name.length);

  // a =  '1'
  if (/^[\t\r\nf ]*=/.test(context.source)) {
    advanceSpaces(context); // 删空格
    advanceBy(context, 1); // 删等号
    advanceSpaces(context); // 删空格

    value = parseAttributeValue(context);
  }
  let loc = getSelection(context, start);
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: {
      type: NodeTypes.TEXT,
      content: value,
      loc: loc,
    },
    loc: getSelection(context, start),
  };
}
function parseAttributes(context) {
  const props = [];

  while (context.source.length > 0 && !context.source.startsWith('>')) {
    props.push(parseAttribute(context));
    advanceSpaces(context);
  }
  return props;
}
function parseTag(context) {
  // 可以通过Regexper网站，https://regexr.com/ 进行正则表达式的测试
  const start = getCursor(context);
  const match = /^<\/?([a-z][^\t\r\n\s/>]*)/i.exec(context.source);
  const tag = match ? match[1] : '';
  advanceBy(context, match[0].length); // 删除匹配到的内容
  advanceSpaces(context); // <div   /> 移除空格

  let props = parseAttributes(context);

  const isSelfClosing = context.source.startsWith('/>'); // 是否是自闭合标签
  advanceBy(context, isSelfClosing ? 2 : 1);

  return {
    type: NodeTypes.ELEMENT,
    tag,
    isSelfClosing,
    props,
    loc: getSelection(context, start), // 开头标签解析后的信息
  };
}
function parseElement(context) {
  // <div > 有可能有空格
  // 在AST explorer中查看被转换后的AST，然后实现函数
  const ele = parseTag(context);

  const children = parseChildren(context); // 递归解析儿子节点

  if (context.source.startsWith('</')) {
    parseTag(context); // 闭合标签没有什么需要处理的，直接移除即可
  } // <div></div>

  (ele as any).children = children;
  (ele as any).loc = getSelection(context, ele.loc.start); // 位置

  return ele;
}
function parseChildren(context) {
  const nodes = [];
  while (!isEnd(context)) {
    const c = context.source;
    let node;
    if (c.startsWith('{{')) {
      // 插值
      node = parseInterpolation(context);
    } else if (c[0] === '<') {
      // 标签，<div>
      node = parseElement(context);
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

  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    // 将空节点进行压缩
    if (node.type === NodeTypes.TEXT) {
      // 如果是空白字符 清空
      if (!/[^\s]/.test(node.content)) {
        nodes[i] = null; // 空白字符清空
      } else {
        node.content = node.content.replace(/\s+/g, ' ');
      }
    }
  }
  return nodes.filter(Boolean);
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

export { parse };
