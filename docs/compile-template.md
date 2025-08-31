# 模板编译

整体过程：

1. 模板转换成 AST 语法树 => 虚拟 DOM
2. 对树进行优化，（打标记、patchFlag）
3. 根据转换后的代码生成字符串

AST 语法树，用到的场景：TS => JS, ES6 => ES5

代码转换 AST 的在线工具：[astexplorer.net](https://astexplorer.net/)
