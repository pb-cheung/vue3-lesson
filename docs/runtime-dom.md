# runtime-dom

## 初始化目录

创建好目录，复制 reactivity 目录的 package.json 粘贴过来修改个别字段后保存。

```bash
pnpm install @vue/shared@workspace @vue/reactivity@workspace --filter @vue/runtime-dom
# or:
pnpm install @vue/shared @vue/reactivity --filter @vue/runtime-dom --workspace
```

在`@vue/runtime-dom`包中，安装来自工作区的本地依赖包，命令运行完后，在 package.json 中添加了两条依赖。
个人操作使用第一条命令有报错，无法成功添加依赖配置，使用第二条正常。
