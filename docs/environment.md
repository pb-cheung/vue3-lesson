# 环境搭建

## pnpm

## import

问题场景：

reactivity 中使用 shared（别的包）的模块，使用传统的相对路径方式导入 shared 模块自然是可以的。
但是，二者是相互独立的，也会发布独立的 npm 包，我们期望像使用 npm 包那样导入使用，修改包路径为`'@vue/shared'`后，
会发现有找不到对应模块的报错，如果 npm i @vue/shared 安装了这个依赖，它会映射到我们安装的依赖，而不是我们正在调试的`packages`源码目录，与我们的预期也是不一致的。

```javascript
// 传统方式
import { isObject } from '../../shared/src';

// 期望的方式
import { isObject } from '@vue/shared';
```

解决：

需要依赖 TS 的能力，`tsconfig.json` 中添加映射配置，

```json
{
  "baseUrl": "./" /* Specify the base directory to resolve non-relative module names. */,
  "paths": {
    /* Specify a set of entries that re-map imports to additional lookup locations. */
    "@vue/*": ["packages/*/src"]
  }
}
```

声明依赖关系

运行一下命令，指定`reactivity`的依赖`@vue/shared`来自于工作区`workspace`，

```bash
pnpm install @vue/shared --workspace --filter @vue/reactivity
```

命令执行完后，会在`packages/reactivity/package.json`中添加了如下依赖配置：

```json
"dependencies": {
    "@vue/shared": "workspace:^"
  }
```

说明：

- 这个配置只在开发环境有效，reactivity 目录中 node_modules 中会创建到工作区 shared 的软链。
- package.json 中的配置涉及包管理器合构建脚本对应运行时，tsconfig.json 涉及 TypeScript 编译器对应编译时。
- 发布 npm 包的时候会使用工具（learn 或脚本）将`workspace:^`替换为常规的版本号`x.y.z`
