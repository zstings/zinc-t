# Zinc - 项目上下文文档

> 将此文档粘贴给 Trae 编辑器的 AI，它将获得完整的项目上下文。

## 一、项目概述

我要做一个叫 "zinc" 的 npm 包，功能是：前端开发者用 Vite 创建 Web 项目，安装这个包后，`npm run build` 自动将前端构建产物打包成一个原生可执行文件（.exe/.app）。

**技术架构**：
- Rust 壳：使用 wry（WebView）+ tao（窗口管理），负责创建窗口、加载前端资源、处理 IPC
- TypeScript 构建工具：负责将 Vite 的 dist/ 嵌入到 Rust 壳二进制文件尾部
- TypeScript 运行时 API：前端通过 `import { window, fs, os } from "zinc"` 调用原生 API
- Vite 插件：在 `closeBundle` 钩子中自动触发构建

**项目目录结构**：
```
zinc/
├── shell/                    # Rust 壳
│   ├── Cargo.toml
│   └── src/main.rs           # 壳的全部代码（单文件）
├── src/                      # TypeScript 核心代码
│   ├── index.ts              # 主入口
│   ├── cli.ts                # CLI 工具
│   ├── build/embed.ts        # 资源嵌入引擎
│   ├── vite-plugin/index.ts  # Vite 插件
│   └── runtime/index.ts      # 前端运行时 API
├── example/                  # 示例项目
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 二、Rust 壳的关键设计

### 2.1 依赖版本（使用最新稳定版）

```toml
[dependencies]
wry = "0.55"                     # WebView（最新稳定版）
tao = "0.34"                     # 窗口管理（最新稳定版，与 wry 0.55 配套）
serde = { version = "1", features = ["derive"] }
serde_json = "1"
flate2 = "1"                     # zlib 解压
mime_guess = "2"
hostname = "0.4"                 # 获取主机名（最新版）
```

**重要**：wry 0.55 的 API 与旧版（0.27）有重大变化。请务必查阅 wry 0.55 和 tao 0.34 的官方文档来编写代码。关键变化包括：
- wry 0.55 不再内部依赖 tao，而是通过 `raw-window-handle` trait 接受任何窗口
- `WebViewBuilder::build()` 现在接受 `&Window`（任何实现了 `HasWindowHandle` 的类型）
- tao 0.34 的 `EventLoop` API 可能有变化
- `evaluate_script` 在 `WebView` 上直接可用

### 2.2 资源嵌入格式

二进制文件尾部追加：
```
[MAGIC "ZINC"(4B)] [索引长度(4B, u32 LE)] [索引JSON] [zlib压缩的资源数据] [资源起始偏移量(8B, u64 LE)]
```

索引格式：`{ "index.html": [offset, length], "assets/main.js": [offset, length], ... }`

运行时从 exe 末尾 8 字节读取偏移量 → 找到 MAGIC → 读取索引 → 读取压缩数据 → flate2 解压。

### 2.3 IPC 通信架构

前端通过注入的 JS Bridge 调用原生 API，壳通过 IPC handler 处理请求并返回结果。

**关键点**：
- wry 的 IPC handler 回调中，需要能调用 `webview.evaluate_script()` 来返回结果给前端
- 如果 IPC handler 的参数不包含 `WebView` 引用，需要使用 `EventLoopProxy` 或其他机制将脚本转发到持有 `WebView` 的线程执行
- 请根据 wry 0.55 + tao 0.34 的实际 API 来实现

### 2.4 前端注入的 JS Bridge

壳启动时通过 `with_initialization_script` 注入一段 JS，创建全局对象 `window.__ZINC__`：

```javascript
// 前端调用：window.__ZINC__.call("window.setTitle", ["Hello"])
// 实际通过 IPC 发送：window.ipc.postMessage(JSON.stringify({id, method, args}))
// 壳返回结果：window.__ZINC__.__resolve__(id, code, message, data)

// 事件推送：壳通过 evaluate_script 调用
// window.__ZINC__.__emit__("window.resized", {width: 800, height: 600})
```

### 2.5 壳支持两种运行模式

- **生产模式**（默认）：从 exe 尾部嵌入资源加载
- **开发模式**（`--dev --dev-dir ./dist`）：从外部目录加载资源

## 三、TypeScript 构建嵌入逻辑

`src/build/embed.ts` 的 `build()` 函数：

1. 读取预编译壳二进制
2. 扫描 dist/ 目录所有文件
3. 生成 `zinc.config.json`（应用配置，自动嵌入）
4. 拼接所有文件 → 记录索引 → zlib 压缩
5. 构建资源尾部：MAGIC + 索引长度 + 索引JSON + 压缩数据 + 偏移量
6. 追加到壳二进制末尾
7. 输出最终可执行文件

## 四、当前状态

- ✅ TypeScript 代码全部完成，编译通过
- ✅ 资源嵌入逻辑已测试验证（魔数、索引、压缩、二进制追加全部正确）
- ✅ Vite 插件、CLI 工具、运行时 API 全部完成
- ⚠️ Rust 壳代码需要基于 wry 0.55 + tao 0.34 **重新编写**

## 五、Rust 壳开发指引

由于 wry 从 0.27 升级到 0.55，API 有重大变化，之前的代码不能直接使用。请：

1. **查阅官方文档**：
   - wry 0.55: https://docs.rs/wry/0.55.0/wry/
   - tao 0.34: https://docs.rs/tao/0.34.8/tao/
   - wry 0.55 示例代码在文档首页

2. **参考 wry 0.55 官方示例**来编写窗口创建 + WebView + 事件循环的代码

3. **核心功能需求**：
   - 创建窗口并加载自定义协议 `zinc://` 的前端资源
   - IPC handler 处理前端 API 调用
   - evaluate_script 返回 IPC 结果和推送事件
   - 从 exe 尾部读取嵌入资源（zlib 解压）
   - 从外部目录读取资源（开发模式）

4. **已知 API 变化**（wry 0.55 vs 0.27）：
   - `WebViewBuilder::build()` 签名变了，现在接受 `&impl HasWindowHandle`
   - `with_custom_protocol` 可能使用异步 responder (`RequestAsyncResponder`)
   - `with_ipc_handler` 签名可能变了
   - `evaluate_script` 在 `WebView` 上
   - tao 的 `EventLoop` API 可能变了

## 六、完整的目标 API 列表

壳需要处理的 IPC 方法（namespace.method 格式）：

**window**: close, setTitle, setSize, getSize, setPosition, minimize, maximize, unmaximize, isMaximized, setFullscreen, isFullscreen, setResizable, setAlwaysOnTop, setVisible, setFocus, isFocused, scaleFactor, setDecorations, dragWindow, center

**fs**: readTextFile, readBinaryFile, writeTextFile, writeBinaryFile, readDir, createDir, removeFile, exists, stat, copyFile, rename, appDataDir, resourceExists, resourceLoad

**app**: getConfig, version

**os**: platform, arch, homeDir, tempDir, hostname

**process**: pid, cwd, env, exit

**dialog**: openFile(暂未实现), saveFile(暂未实现), message(暂未实现)

**clipboard**: readText(暂未实现), writeText(暂未实现)

## 七、验证方式

编译成功后，测试步骤：

```bash
# 1. 编译壳
cd shell && cargo build --release

# 2. 创建预编译目录
mkdir -p prebuilt/win32-x64
cp target/release/zinc-shell.exe prebuilt/win32-x64/shell.exe

# 3. 安装 TypeScript 依赖
cd .. && npm install && npm run build

# 4. 测试示例
cd example && npm install && npm run build
# 应该在 release/ 目录生成可执行文件

# 5. 开发模式测试
./prebuilt/win32-x64/shell.exe --dev --dev-dir dist
# 应该打开窗口并加载 dist/index.html
```
