# Zinc

超轻量级桌面应用构建库。Vite 构建后一键打包为原生可执行文件。

## 特性

- **超轻量**：构建产物最小 ~3MB，仅依赖系统 WebView
- **零 Rust 门槛**：`npm install zinc` 即可使用，不需要 Rust 工具链
- **Vite 原生集成**：Vite 插件自动接管构建流程
- **单文件输出**：前端资源嵌入到可执行文件中
- **双模式运行**：开发时在浏览器中调试，生产时在原生壳中运行
- **丰富的 API**：窗口、文件系统、系统信息、进程管理等

## 快速开始

### 1. 创建项目

```bash
npm create vite@latest my-app -- --template vanilla
cd my-app
npm install zinc
```

### 2. 配置 Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { zincPlugin } from "zinc/vite-plugin";

export default defineConfig({
  plugins: [
    zincPlugin({
      name: "我的应用",
      identifier: "com.example.myapp",
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

```html
<script type="module">
  // 测试 Zinc API
  async function testAPI() {
    // 获取系统信息
    const platform = await window.__ZINC__.call('os.platform', []);
    console.log('Platform:', platform);

    // 获取进程 ID
    const pid = await window.__ZINC__.call('process.pid', []);
    console.log('PID:', pid);

    // 设置窗口标题
    await window.__ZINC__.call('window.setTitle', ['我的应用']);
  }

  testAPI();
</script>
```

### 4. 构建打包

```bash
npm run build
# Vite 构建完成后，zinc 插件自动将 dist/ 嵌入到可执行文件
# 输出到 release/ 目录
```

或使用 CLI：

```bash
npx zinc build -i dist -n "我的应用" --width 1200 --height 800
```

### 5. 开发模式

```bash
# 方式 1：浏览器开发
npm run dev

# 方式 2：原生壳 + 开发服务器
npx zinc dev --dir .
```

## 架构

```
┌─────────────────────────────────┐
│  前端代码 (HTML/JS/CSS)          │
│  import { window, fs } from "zinc" │
├─────────────────────────────────┤
│  运行时 Bridge (注入 JS)         │
│  window.__ZINC__.call("fs.read")   │
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
