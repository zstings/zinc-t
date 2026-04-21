# Vokex

超轻量级桌面应用构建库。Vite 构建后一键打包为原生可执行文件。

## 特性

- **超轻量**：构建产物最小 ~4.6MB，仅依赖系统 WebView
- **零 Rust 门槛**：`npm install vokex` 即可使用，不需要 Rust 工具链
- **Vite 原生集成**：Vite 插件自动接管构建流程
- **单文件输出**：前端资源嵌入到可执行文件中
- **双模式运行**：开发时在浏览器中调试，生产时在原生壳中运行
- **丰富的 API**：窗口、文件系统、系统信息、进程管理、网络请求等

## 快速开始

### 1. 创建项目

```bash
npm create vite@latest my-app -- --template vanilla
cd my-app
npm install vokex
```

### 2. 配置 Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { vokexPlugin } from "vokex/vite-plugin";

export default defineConfig({
  plugins: [
    vokexPlugin({
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

```typescript
import { app, fs, process, computer, http, storage } from "vokex";

// 应用信息
const name = await app.getName();
const version = await app.getVersion();

// 文件系统
const content = await fs.readFile("config.json");
await fs.writeFile("output.txt", "Hello World");

// 系统信息
const cpu = await computer.getCpuInfo();
const memory = await computer.getMemoryInfo();
const os = await computer.getOsInfo();

// HTTP 请求
const response = await http.get("https://api.example.com/data");
const result = await http.post("https://api.example.com/submit", { key: "value" });

// 本地存储
await storage.setData("user", { name: "张三", age: 25 });
const user = await storage.getData("user");
```

### 4. 构建打包

```bash
npm run build
# Vite 构建完成后，vokex 插件自动将 dist/ 嵌入到可执行文件
# 输出到 release/ 目录
```

或使用 CLI：

```bash
npx vokex build -i dist -n "我的应用" --width 1200 --height 800
```

### 5. 开发模式

```bash
# 方式 1：浏览器开发
npm run dev

# 方式 2：原生壳 + 开发服务器
npx vokex dev --dir .
```

## 架构

```
┌─────────────────────────────────┐
│  前端代码 (HTML/JS/CSS)          │
│  import { app, fs, http } from "vokex" │
├─────────────────────────────────┤
│  运行时 Bridge (注入 JS)         │
│  window.__VOKEX__.call("fs.read")   │
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
[MAGIC(5B)] [索引长度(4B)] [索引JSON] [zlib压缩数据] [偏移量(8B)]
```

索引格式：`{ "index.html": [offset, length], "assets/main.js": [offset, length] }`

## 编译壳

如果你需要自己编译壳（而不是使用预编译版本）：

```bash
cd shell
cargo build --release
# 输出: shell/target/release/vokex-shell.exe (Windows)
#       shell/target/release/vokex-shell     (macOS/Linux)
```

## API 列表

### app - 应用管理
`quit()` `exit(code)` `restart()` `getAppPath()` `getPath(name)` `getVersion()` `getName()` `setName(name)` `getLocale()` `setDockBadge(text)` `requestSingleInstanceLock()` `setProxy(config)` `on(event, callback)`

### browserWindow - 窗口管理
`create(options)` `getAll()` `getFocused()` `close()` `show()` `hide()` `minimize()` `maximize()` `unmaximize()` `restore()` `focus()` `blur()` `isMaximized()` `isMinimized()` `isFullScreen()` `setFullScreen(flag)` `setTitle(title)` `getTitle()` `setSize(width, height)` `getSize()` `setMinimumSize(width, height)` `setMaximumSize(width, height)` `setResizable(flag)` `setAlwaysOnTop(flag)` `setPosition(x, y)` `getPosition()` `center()` `setOpacity(opacity)` `setBackgroundColor(color)` `setIcon(icon)` `loadFile(path)` `loadURL(url)` `reload()` `setProgressBar(progress)` `setSkipTaskbar(flag)` `capturePage()` `on(event, callback)`

### dialog - 对话框
`showOpenDialog(options)` `showSaveDialog(options)` `showMessageBox(options)` `showErrorBox(title, content)` `showColorDialog(options)`

### menu - 菜单
`setApplicationMenu(template)` `setContextMenu(template)` `removeContextMenu()` `sendAction(action)`

### tray - 系统托盘
`create(options)` `setToolTip(text)` `setTitle(title)` `setMenu(template)` `setImage(icon)` `destroy()` `displayBalloon(options)` `on(event, callback)`

### clipboard - 剪贴板
`readText()` `writeText(text)` `readImage()` `writeImage(image)` `readHTML()` `writeHTML(html)` `hasText()` `clear()`

### notification - 系统通知
`show(options)` `isSupported()`

### screen - 屏幕信息
`getAllDisplays()` `getPrimaryDisplay()` `getCursorScreenPoint()`

### fs - 文件系统
`readFile(path)` `readFileBinary(path)` `writeFile(path, data)` `appendFile(path, data)` `deleteFile(path)` `readDir(path)` `createDir(path)` `removeDir(path)` `stat(path)` `exists(path)` `copyFile(source, destination)` `moveFile(source, destination)` `watch(path)`

### shell - 系统命令
`openExternal(url)` `openPath(path)` `execCommand(command, options?)` `trashItem(path)`

### process - 进程管理
`getPid()` `getArgv()` `getEnv(key)` `getPlatform()` `getArch()` `getUptime()` `getCpuUsage()` `getMemoryInfo()` `exit(code)` `kill(pid, signal?)` `on(event, callback)`

### computer - 系统硬件信息 (Windows)
`getCpuInfo()` `getMemoryInfo()` `getOsInfo()` `getDisplays()` `getMousePosition()` `getKeyboardLayout()`

### http - 网络请求
`get(url, options?)` `post(url, data, options?)` `put(url, data, options?)` `delete(url, options?)` `request(options)`

### storage - 本地存储
`setData(key, value)` `getData(key)` `getKeys()` `has(key)` `removeData(key)` `clear()`

### events - 事件总线
`on(event, callback)` `off(event, callback)` `once(event, callback)` `emit(event, data)`

### shortcut - 全局快捷键
（预留接口，未实现）

## 类型定义

```typescript
// 文件系统
interface DirEntry {
  name: string;
  isDir: boolean;
}

interface FileInfo {
  isFile: boolean;
  isDir: boolean;
  size: number;
  modified: number;
}

// HTTP
interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  ok: boolean;
}

// 计算机信息
interface CpuInfo {
  manufacturer: string;
  model: string;
  cores: number;
  logicalProcessors: number;
  architecture: string;
}

interface MemoryInfo {
  total: number;
  available: number;
  used: number;
}

interface OsInfo {
  name: string;
  version: string;
  platform: string;
  arch: string;
}

interface Display {
  id: string;
  name: string;
  width: number;
  height: number;
  scaleFactor: number;
  isPrimary: boolean;
}

// 进程
interface CpuUsage {
  user: number;
  system: number;
}

interface MemoryInfo {
  rss: number;
  heapTotal: number;
}

// Shell
interface ShellResult {
  code: number;
  stdout: string;
  stderr: string;
  success: boolean;
}

interface ExecOptions {
  cwd?: string;
  env?: Record<string, string>;
}
```

## 实现状态

| 模块 | 完成度 | 说明 |
|------|--------|------|
| app | 13/24 | 核心功能完成 |
| browserWindow | 框架已有 | 基于 tao/wry |
| dialog | 占位 | 待实现 |
| menu | 未开始 | |
| tray | 未开始 | |
| clipboard | 占位 | 待实现 |
| notification | 1/2 | 基础功能完成 |
| screen | 未开始 | |
| fs | 12/13 | 仅 watch 未完成 |
| shell | 4/4 | 完整实现 |
| process | 10/11 | 仅 on('exit') 未完成 |
| computer | 6/6 | Windows 平台完整实现 |
| http | 5/5 | 完整实现 |
| storage | 6/6 | 完整实现 |
| events | 未开始 | |
| shortcut | 未开始 | |

## License

MIT
