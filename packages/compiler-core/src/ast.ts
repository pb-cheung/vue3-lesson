export enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  COMMENT,
  SIMPLE_EXPRESSION, // 1 + 1
  INTERPOLATION, // {{}}
  ATTRIBUTE,
  DIRECTIVE,
  // containers
  COMPOUND_EXPRESSION, // {{ name }} + 'abc'
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL, // createVnode
  // codegen
  VNODE_CALL,
  JS_CALL_EXPRESSION, // ()
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
  JS_CONDITIONAL_EXPRESSION,
  JS_CACHE_EXPRESSION,

  // ssr codegen
  JS_BLOCK_STATEMENT,
  JS_TEMPLATE_LITERAL,
  JS_IF_STATEMENT,
  JS_ASSIGNMENT_EXPRESSION,
  JS_SEQUENCE_EXPRESSION,
  JS_RETURN_STATEMENT,
}
// copy from: https://github.com/vuejs/core/blob/v3.4.23/packages/compiler-core/src/ast.ts
