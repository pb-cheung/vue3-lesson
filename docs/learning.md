
```bash
 pnpm install @vue/shared --workspace --filter @vue/reactivity
```
运行后，reativity/package.json中新增了依赖配置：
```json
{
  "dependencies": {
    "@vue/shared": "workspace:*"
  }
}
```

## Vue3响应式原理
### CompositionAPI

>简单的组件仍然可以采用OptionsAPI进行编写（但是在Vue3中基本不再使用），
> compositionAPI在复杂的逻辑中有着明显的优势~

* CompositionAPI在用户编写复杂业务逻辑不会出现反复横跳的问题。（看一下上面的data区域，再看一下methods区域对应的方法）
* CompositionAPI不存在`this`指向不明确问题
* CompositionAPI对`tree-shaking`更加友好，代码也更容易压缩
* CompositionAPI提取公共逻辑非常方便

>reactivity模块中就包含了很多我们经常使用到的API，例如：computed、reactive、ref、effect等。