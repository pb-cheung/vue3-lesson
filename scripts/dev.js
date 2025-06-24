// 这个文件会帮我们打包packages下的模块，最终打包出js文件

// node dev.js 要打包的名字 -f 打包的格式
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from "module";
import minimist from 'minimist';
import esbuild from 'esbuild';

// node中的命令行参数通过process.argv来获取
const args = minimist(process.argv.slice(2));

// esm使用commonjs变量
const __filename = fileURLToPath(import.meta.url); // 获取文件的绝对路径
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const target = args._[0] || 'reactivity'; // 打包哪个项目
const format = args.f || 'iife'; // 打包后的模块规范
console.log('args: ', target, format);

// node中esm模块没有__dirname
// resolve(__dirname)   ReferenceError: __dirname is not defined in ES module scope
// const entry = resolve(__dirname);

// 入口文件
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
const pkg = require(`../packages/${target}/package.json`);

// 根据需要进行打包
esbuild.context({
    entryPoints: [entry], // 入口
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`), // 出口
    bundle: true, // reactivity  -> shared 会打包到一起
    platform: 'browser', // 打包后给浏览器使用
    sourcemap: true, // 可以调试源代码
    format, // cjs ems iife(需要给定全局的名称)
    globalName: pkg.buildOptions?.name // iife模块需要给定全局的名称
})
.then((ctx) => {
    console.log('start dev');
    return ctx.watch();
})