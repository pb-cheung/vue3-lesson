# runtime-dom

## 初始化目录

创建好目录，复制 reactivity 目录的 package.json 粘贴过来修改个别字段后保存。

```bash
pnpm install @vue/shared @vue/reactivity --filter @vue/runtime-dom --workspace
# 低版本pnpm可使用：
pnpm install @vue/shared@workspace @vue/reactivity@workspace --filter @vue/runtime-dom
```

在`@vue/runtime-dom`包中，安装来自工作区的本地依赖包，命令运行完后，在 package.json 中添加了两条依赖。

pnpm v7+版本中，添加工作区的依赖语法~~`@workspace`~~被废弃了，改为`workspace:*`，即`workspace:`前缀+版本范围。
使用旧语法，它会尝试从仓库中去安装包而不是本地工作区。

命令行中使用，`@workspace` => `@workspace:*`，或者使用`--workspace`选项
~~`pnpm install @vue/shared@workspace @vue/reactivity@workspace --filter @vue/runtime-dom`~~
改为
`pnpm install @vue/shared@workspace:* @vue/reactivity@workspace:* --filter @vue/runtime-dom`

## 源码使用

上一步运行过 pnpm install，为 runtime-dom 添加依赖配置后，pnpm 会创建符号链接（symbol link），node_modules 中的包会链接到源码 pckages 目录中的同名包目录。

```bash
ls -la /project/path/vue3-lesson/node_modules/@vue/
lrwxr-xr-x   1 pb  staff   26 Jul 15 22:51 runtime-dom -> ../../packages/runtime-dom
lrwxr-xr-x   1 pb  staff   25 Jul 15 22:51 reactivity -> ../../packages/reactivity
lrwxr-xr-x   1 pb  staff   21 Jul 15 22:51 shared -> ../../packages/shared
```

问题：此时调试的 HTML 页面中引用的`'/node_modules/@vue/runtime-dom/dist/runtime-dom.esm-browser.js'`就访问不到了，因为整个目录链接到了源码 dist，其中又没有同名称的文件。这个问题教程中没有出现。

```javascript
import {
  createRenderer,
  render,
  h,
} from '/node_modules/@vue/runtime-dom/dist/runtime-dom.esm-browser.js';
```

解决：切换为，使用 vue 目录资源，`'/node_modules/vue/dist/vue.runtime.esm-browser.js'`。
