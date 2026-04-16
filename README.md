# A Framework

超轻量级桌面应用构建库。Vite 构建后一键打包为原生可执行文件。

## 特性

- **超轻量**：构建产物最小 ~3MB，仅依赖系统 WebView
- **零 Rust 门槛**：`npm install a` 即可使用，不需要 Rust 工具链
- **Vite 原生集成**：Vite 插件自动接管构建流程
- **单文件输出**：前端资源嵌入到可执行文件中
- **双模式运行**：开发时在浏览器中调试，生产时在原生壳中运行
- **丰富的 API**：窗口、文件系统、系统信息、进程管理等

## 快速开始

### 1. 创建项目

```bash
npm create vite@latest my-app -- --template vanilla
cd my-app
npm install a
```

### 2. 配置 Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { aPlugin } from "a/vite-plugin";

export default defineConfig({
  plugins: [
    aPlugin({
      name: "我的应用",
      window: {
        title: "我的应用",
        width: 1200,
        height: 800,
        center: true,
      },
    }),
  ],
});
```

### 3. 使用 API

```ts
import { window, fs, os, events, isNative } from "a";

// 设置窗口标题
await window.setTitle("Hello!");

// 读写文件
await fs.writeTextFile("~/data.txt", "Hello World");
const content = await fs.readTextFile("~/data.txt");

// 获取系统信息
const platform = await os.platform();

// 监听事件
events.on("window.resized", (event, data) => {
  console.log(`窗口大小: ${data.width} × ${data.height}`);
});

// 环境检测
if (isNative) {
  console.log("运行在原生壳中");
} else {
  console.log("运行在浏览器中（开发模式）");
}
```

### 4. 构建打包

```bash
npm run build
# Vite 构建完成后，a 插件自动将 dist/ 嵌入到可执行文件
# 输出到 release/ 目录
```

或使用 CLI：

```bash
npx a build -i dist -n "我的应用" --width 1200 --height 800
```

### 5. 开发模式

```bash
npm run dev
# 正常在浏览器中开发和调试
# a 的 API 在浏览器中会安全降级，不会报错
```

## 架构

```
┌─────────────────────────────────┐
│  前端代码 (HTML/JS/CSS)          │
│  import { window, fs } from "a" │
├─────────────────────────────────┤
│  运行时 Bridge (注入 JS)         │
│  window.__A__.call("fs.read")   │
├─────────────────────────────────┤
│  IPC: postMessage ↔ evaluate    │
├─────────────────────────────────┤
│  Rust 壳 (wry + tao)            │
│  窗口管理 | API 路由 | 资源加载   │
├─────────────────────────────────┤
│  系统 WebView                   │
│  Windows: WebView2              │
│  macOS: WKWebView               │
└─────────────────────────────────┘
```

## 资源嵌入格式

二进制文件尾部追加：

```
[MAGIC(4B)] [索引长度(4B)] [索引JSON] [zlib压缩数据] [偏移量(8B)]
```

索引格式：`{ "index.html": [offset, length], "assets/main.js": [offset, length] }`

## 编译壳

如果你需要自己编译壳（而不是使用预编译版本）：

```bash
cd shell
cargo build --release
# 输出: shell/target/release/shell.exe (Windows)
#       shell/target/release/shell     (macOS/Linux)
```

## API 列表

### window
`close` `setTitle` `setSize` `getSize` `setPosition` `minimize` `maximize` `unmaximize` `isMaximized` `setFullscreen` `isFullscreen` `setResizable` `setAlwaysOnTop` `setVisible` `setFocus` `isFocused` `scaleFactor` `setDecorations` `dragWindow` `center`

### fs
`readTextFile` `readBinaryFile` `writeTextFile` `writeBinaryFile` `readDir` `createDir` `removeFile` `exists` `stat` `copyFile` `rename` `appDataDir` `resourceExists` `resourceLoad`

### app
`getConfig` `version`

### os
`platform` `arch` `homeDir` `tempDir` `hostname`

### process
`pid` `cwd` `env` `exit`

### events
`on` `off` `onAny`

### dialog / clipboard
（基础框架已预留，完整实现需要额外依赖）

## License

MIT
