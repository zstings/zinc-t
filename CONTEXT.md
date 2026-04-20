# Vokex - 项目上下文文档

> 将此文档粘贴给 Trae 编辑器的 AI，它将获得完整的项目上下文。

## 一、项目概述

**Vokex** 是一个超轻量级桌面应用构建库，让前端开发者能够使用 Vite 创建 Web 项目，安装这个包后，`npm run build` 自动将前端构建产物打包成一个原生可执行文件（.exe/.app）。

### 核心特性

- **超轻量**：构建产物最小 ~3MB，仅依赖系统 WebView
- **零 Rust 门槛**：`npm install vokex` 即可使用，不需要 Rust 工具链
- **Vite 原生集成**：Vite 插件自动接管构建流程
- **单文件输出**：前端资源嵌入到可执行文件中
- **双模式运行**：开发时在浏览器中调试，生产时在原生壳中运行
- **丰富的 API**：窗口、文件系统、系统信息、进程管理等

### 技术架构

```
┌─────────────────────────────────┐
│  前端代码 (HTML/JS/CSS)          │
│  import { window, fs } from "vokex" │
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

**技术栈**：
- **Rust 壳**：使用 wry 0.55（WebView）+ tao 0.34（窗口管理），负责创建窗口、加载前端资源、处理 IPC
- **TypeScript 构建工具**：负责将 Vite 的 dist/ 嵌入到 Rust 壳二进制文件尾部
- **TypeScript 运行时 API**：前端通过 `import { window, fs, os } from "vokex"` 调用原生 API
- **Vite 插件**：在 `closeBundle` 钩子中自动触发构建

### 项目目录结构

```
vokex/
├── shell/                    # Rust 壳
│   ├── Cargo.toml           # Rust 依赖配置
│   ├── src/main.rs          # 壳的全部代码（单文件，约 500+ 行）
│   └── target/              # Rust 编译输出
│       └── release/
│           └── vokex-shell.exe  # 编译后的壳
├── src/                      # TypeScript 核心代码
│   ├── index.ts              # 主入口，导出 build 和 vokexPlugin
│   ├── cli.ts                # CLI 工具（build/validate/dev 命令）
│   ├── build/embed.ts        # 资源嵌入引擎
│   ├── vite-plugin/index.ts  # Vite 插件
│   └── runtime/index.ts      # 前端运行时 API
├── dist/                     # TypeScript 编译输出
├── prebuilt/                 # 预编译壳
│   └── win32-x64/
│       └── shell.exe         # Windows 预编译壳
├── example/                  # 示例项目
│   ├── index.html            # 示例 HTML
│   ├── package.json          # 示例依赖
│   ├── vite.config.ts        # 示例 Vite 配置
│   ├── dist/                 # 示例构建产物
│   └── release/              # 示例原生应用输出
│       └── Vokex Demo.exe    # 构建的可执行文件
├── package.json              # npm 包配置
├── tsconfig.json             # TypeScript 配置
├── README.md                 # 使用文档
└── CONTEXT.md                # 本文档
```

## 二、核心模块详解

### 2.1 TypeScript 核心模块

#### 2.1.1 主入口 (src/index.ts)

导出核心功能：
- `build()` - 构建原生可执行文件
- `vokexPlugin()` - Vite 插件
- 类型定义：`BuildResult`, `ValidateResult`, `VokexPluginOptions`

#### 2.1.2 CLI 工具 (src/cli.ts)

提供三个命令：

**1. `vokex build`** - 构建原生可执行文件
```bash
vokex build -i dist -n "我的应用" --width 1200 --height 800
```
选项：
- `-i, --input <dir>` - 前端构建产物目录（默认: dist）
- `-s, --shell <path>` - 壳二进制路径（默认: 自动检测）
- `-o, --output <dir>` - 输出目录（默认: release）
- `-n, --name <name>` - 应用名称（默认: app）
- `--title <title>` - 窗口标题
- `--width <px>` - 窗口宽度（默认: 1200）
- `--height <px>` - 窗口高度（默认: 800）
- `--min-width <px>` - 最小宽度
- `--min-height <px>` - 最小高度
- `--resizable <bool>` - 是否可缩放（默认: true）
- `--fullscreen <bool>` - 是否全屏（默认: false）
- `--transparent <bool>` - 是否透明（默认: false）
- `--no-decoration <bool>` - 是否无边框（默认: false）
- `--always-on-top <bool>` - 是否置顶（默认: false）
- `-v, --verbose` - 显示详细日志

**2. `vokex validate`** - 验证二进制文件
```bash
vokex validate release/my-app.exe
```

**3. `vokex dev`** - 开发模式
```bash
vokex dev --dir .
```
启动 Vite 开发服务器 + 壳加载开发服务器，实现热重载。

#### 2.1.3 资源嵌入引擎 (src/build/embed.ts)

核心功能：
1. **扫描资源**：递归扫描 dist/ 目录所有文件
2. **生成索引**：创建文件路径 → [offset, length] 的映射
3. **压缩资源**：使用 zlib 压缩所有文件数据
4. **构建尾部**：MAGIC + 索引长度 + 索引JSON + 压缩数据 + 偏移量
5. **追加到壳**：将资源尾部追加到预编译壳二进制末尾

**资源嵌入格式**：
```
[MAGIC "VOKEX"(5B)] [索引长度(4B, u32 LE)] [索引JSON] [zlib压缩的资源数据] [资源起始偏移量(8B, u64 LE)]
```

索引格式示例：
```json
{
  "index.html": [0, 1234],
  "assets/main.js": [1234, 5678],
  "__vokex_name__": "我的应用",
  "__vokex_identifier__": "com.example.myapp"
}
```

**验证功能**：
- 读取 exe 末尾 8 字节获取偏移量
- 验证魔数 "VOKEX"
- 读取索引和压缩数据
- 返回文件数量和原始大小

#### 2.1.4 Vite 插件 (src/vite-plugin/index.ts)

在 Vite 构建完成后自动触发原生构建：

```ts
// vite.config.ts
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
      verbose: true,
      openAfterBuild: true, // 构建完成后自动打开应用
    })
  ]
});
```

插件配置选项：
- `name` - 应用名称
- `identifier` - 应用标识符（用于存储用户数据目录）
- `icon` - 应用图标路径
- `window` - 窗口配置
- `outputName` - 输出文件名（默认使用应用名）
- `outputDir` - 输出目录（默认为 release/）
- `shellPath` - 自定义壳二进制路径
- `skipInDev` - 是否在开发模式下跳过构建
- `verbose` - 是否显示详细日志
- `openAfterBuild` - 构建完成后是否自动打开应用

**开发模式支持**：
- 在 `configureServer` 钩子中输出服务器端口和标识符
- CLI 的 `vokex dev` 命令会读取这些信息并启动壳

#### 2.1.5 运行时 API (src/runtime/index.ts)

前端通过 `window.__VOKEX__` 对象调用原生 API：

```ts
interface VokexAPI {
  call: (method: string, args: any[]) => Promise<any>;
  __emit__: (event: string, data?: any) => void;
  on: (event: string, listener: (data: any) => void) => void;
  off: (event: string, listener: (data: any) => void) => void;
}
```

在浏览器环境中，API 会安全降级，不会报错。

### 2.2 Rust 壳 (shell/)

#### 2.2.1 依赖配置 (Cargo.toml)

```toml
[dependencies]
wry = "0.55"                     # WebView（最新稳定版）
tao = "0.34"                     # 窗口管理（与 wry 0.55 配套）
serde = { version = "1", features = ["derive"] }
serde_json = "1"
flate2 = "1"                     # zlib 解压
mime_guess = "2"                 # MIME 类型推断
hostname = "0.4"                 # 获取主机名
dirs = "5"                       # 获取系统目录

[target.'cfg(target_os = "linux")'.dependencies]
gtk = "0.18"                     # Linux GTK 支持

[target.'cfg(windows)'.dependencies]
windows-sys = { version = "0.48", features = ["Win32_System_SystemInformation"] }
```

**优化配置**：
```toml
[profile.release]
opt-level = "z"          # 优化大小
lto = true               # 链接时优化
strip = true             # 去除符号
codegen-units = 1        # 单代码生成单元
panic = "abort"          # panic 时直接终止
```

#### 2.2.2 核心功能 (src/main.rs)

**1. 资源加载**
- `Resources::load_from_exe()` - 从 exe 尾部读取嵌入资源
- 解析魔数、索引、压缩数据
- 使用 flate2 解压资源

**2. 自定义协议**
- 注册 `vokex://` 协议
- 根据路径从资源中读取文件
- 自动推断 MIME 类型

**3. IPC 通信**
- 前端通过 `window.ipc.postMessage()` 发送请求
- 壳通过 IPC handler 处理请求
- 使用 `evaluate_script()` 返回结果

**4. 窗口管理**
- 使用 tao 创建窗口
- 支持窗口配置（标题、大小、位置、全屏等）
- 处理窗口事件（关闭、缩放等）

**5. 运行模式**
- **生产模式**（默认）：从 exe 尾部嵌入资源加载
- **开发模式**（`--dev-url http://localhost:5173`）：从开发服务器加载

#### 2.2.3 前端注入的 JS Bridge

壳启动时通过 `with_initialization_script` 注入：

```javascript
// 前端调用：window.__VOKEX__.call("window.setTitle", ["Hello"])
// 实际通过 IPC 发送：window.ipc.postMessage(JSON.stringify({id, method, args}))
// 壳返回结果：window.__VOKEX__.__resolve__(id, code, message, data)

// 事件推送：壳通过 evaluate_script 调用
// window.__VOKEX__.__emit__("window.resized", {width: 800, height: 600})
```

## 三、完整的 API 列表

壳需要处理的 IPC 方法（namespace.method 格式）：

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

### dialog
`openFile` `saveFile` `message` （暂未实现）

### clipboard
`readText` `writeText` （暂未实现）

## 四、使用示例

### 4.1 基础使用

**1. 创建项目**
```bash
npm create vite@latest my-app -- --template vanilla
cd my-app
npm install vokex
```

**2. 配置 Vite**
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

**3. 使用 API**
```html
<script type="module">
  // 测试 Vokex API
  async function testVokexAPI() {
    // 测试 os API
    const osInfo = await window.__VOKEX__.call('os.platform', []);
    console.log('OS:', osInfo);
    
    // 测试 process API
    const pid = await window.__VOKEX__.call('process.pid', []);
    console.log('PID:', pid);
  }
</script>
```

**4. 构建打包**
```bash
npm run build
# Vite 构建完成后，vokex 插件自动将 dist/ 嵌入到可执行文件
# 输出到 release/ 目录
```

### 4.2 开发模式

```bash
# 方式 1：使用 Vite 开发服务器（浏览器）
npm run dev

# 方式 2：使用原生壳 + Vite 开发服务器
npx vokex dev --dir .
```

### 4.3 CLI 使用

```bash
# 构建原生应用
vokex build -i dist -n "我的应用" --width 1200 --height 800

# 验证二进制文件
vokex validate release/my-app.exe

# 开发模式
vokex dev --dir .
```

## 五、项目状态

### 已完成 ✅

1. **TypeScript 核心代码**
   - ✅ 主入口 (src/index.ts)
   - ✅ CLI 工具 (src/cli.ts) - 支持 build/validate/dev 命令
   - ✅ 资源嵌入引擎 (src/build/embed.ts) - 魔数、索引、压缩、二进制追加
   - ✅ Vite 插件 (src/vite-plugin/index.ts) - 自动构建、开发模式支持
   - ✅ 运行时 API (src/runtime/index.ts) - 安全降级

2. **Rust 壳**
   - ✅ 基础框架 (shell/src/main.rs)
   - ✅ 资源加载（从 exe 尾部读取）
   - ✅ 自定义协议 `vokex://`
   - ✅ IPC 通信框架
   - ✅ 窗口管理
   - ✅ 开发模式支持（`--dev-url`）
   - ✅ 编译成功，生成 vokex-shell.exe

3. **构建系统**
   - ✅ TypeScript 编译配置 (tsconfig.json)
   - ✅ Rust 编译配置 (Cargo.toml)
   - ✅ npm 包配置 (package.json)
   - ✅ 预编译壳 (prebuilt/win32-x64/shell.exe)

4. **示例项目**
   - ✅ 完整的示例 (example/)
   - ✅ Vite 配置示例
   - ✅ API 使用示例
   - ✅ 成功构建出可执行文件 (release/Vokex Demo.exe)

### 待完善 ⚠️

1. **API 实现**
   - ⚠️ 部分 API 可能未完全实现或需要测试
   - ⚠️ dialog API（openFile, saveFile, message）暂未实现
   - ⚠️ clipboard API（readText, writeText）暂未实现

2. **跨平台支持**
   - ✅ Windows 平台已测试
   - ⚠️ macOS 平台需要测试和预编译壳
   - ⚠️ Linux 平台需要测试和预编译壳

3. **文档**
   - ✅ README.md 基础文档
   - ✅ CONTEXT.md 详细文档（本文档）
   - ⚠️ API 文档需要完善
   - ⚠️ 教程和示例需要扩充

## 六、开发指引

### 6.1 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 编译 TypeScript
npm run build

# 3. 编译 Rust 壳
cd shell
cargo build --release

# 4. 复制预编译壳
cd ..
mkdir -p prebuilt/win32-x64
cp shell/target/release/vokex-shell.exe prebuilt/win32-x64/shell.exe

# 5. 测试示例
cd example
npm install
npm run build
# 应该在 release/ 目录生成可执行文件
```

### 6.2 开发模式测试

```bash
# 方式 1：浏览器开发
cd example
npm run dev

# 方式 2：原生壳 + 开发服务器
cd example
npx vokex dev --dir .
```

### 6.3 发布流程

```bash
# 1. 确保代码编译通过
npm run build

# 2. 确保壳已编译
cd shell && cargo build --release

# 3. 更新预编译壳
cp shell/target/release/vokex-shell.exe prebuilt/win32-x64/shell.exe

# 4. 测试示例
cd ../example && npm run build

# 5. 发布到 npm
npm publish
```

## 七、技术细节

### 7.1 wry 0.55 + tao 0.34 API 变化

相比旧版本（wry 0.27），主要变化：
- wry 0.55 不再内部依赖 tao，而是通过 `raw-window-handle` trait 接受任何窗口
- `WebViewBuilder::build()` 现在接受 `&Window`（任何实现了 `HasWindowHandle` 的类型）
- tao 0.34 的 `EventLoop` API 可能有变化
- `evaluate_script` 在 `WebView` 上直接可用
- `with_custom_protocol` 可能使用异步 responder (`RequestAsyncResponder`)

### 7.2 资源嵌入原理

1. **构建时**：
   - 扫描 dist/ 目录所有文件
   - 生成索引：`{ "index.html": [0, 1234], "assets/main.js": [1234, 5678] }`
   - 拼接所有文件数据
   - 使用 zlib 压缩
   - 构建尾部：MAGIC + 索引长度 + 索引JSON + 压缩数据 + 偏移量
   - 追加到壳二进制末尾

2. **运行时**：
   - 从 exe 末尾读取 8 字节偏移量
   - 定位到资源起始位置
   - 验证魔数 "VOKEX"
   - 读取索引长度和索引 JSON
   - 读取压缩数据并解压
   - 根据请求路径从索引中查找文件

### 7.3 IPC 通信流程

1. **前端调用**：
   ```javascript
   window.__VOKEX__.call("window.setTitle", ["Hello"])
   ```

2. **Bridge 注入代码**：
   ```javascript
   window.ipc.postMessage(JSON.stringify({
     id: "unique-id",
     method: "window.setTitle",
     args: ["Hello"]
   }))
   ```

3. **Rust IPC Handler**：
   - 解析消息
   - 路由到对应的 API 处理函数
   - 执行操作
   - 返回结果

4. **返回结果**：
   ```javascript
   webview.evaluate_script(
     `window.__VOKEX__.__resolve__("unique-id", 0, "success", "result")`
   )
   ```

## 八、性能指标

### 8.1 构建产物大小

- **Rust 壳**：~655 KB (release 模式，strip + lto)
- **前端资源**：根据项目大小而定
- **最终可执行文件**：壳 + 压缩后的前端资源
- **示例应用**：657 KB (Vokex Demo.exe)

### 8.2 压缩效果

- 使用 zlib 压缩，通常可达到 60-80% 压缩率
- 示例：原始 100 KB → 压缩后 30 KB

### 8.3 启动速度

- 冷启动：< 1 秒
- 热启动：< 0.5 秒
- 资源加载：从内存中直接读取，无磁盘 I/O

## 九、与其他方案对比

| 特性 | Vokex | Electron | Tauri |
|------|-------|----------|-------|
| 构建产物大小 | ~3 MB | ~150 MB | ~10 MB |
| 运行时依赖 | 系统 WebView | Chromium | 系统 WebView |
| 开发语言 | TypeScript + Rust | JavaScript | TypeScript + Rust |
| 构建工具 | Vite | Webpack/Vite | Vite |
| 学习曲线 | 低 | 低 | 中 |
| 性能 | 高 | 中 | 高 |
| 跨平台 | Windows/macOS/Linux | Windows/macOS/Linux | Windows/macOS/Linux |

**Vokex 优势**：
- 最小的构建产物
- 零 Rust 门槛（使用预编译壳）
- 完美集成 Vite 工作流
- 单文件输出，部署简单

**Vokex 劣势**：
- API 相对较少
- 社区生态较小
- 部分高级功能未实现

## 十、未来规划

### 10.1 短期目标

- [ ] 完善所有 API 实现
- [ ] 实现 dialog API（文件对话框、消息框）
- [ ] 实现 clipboard API
- [ ] 添加更多示例（Vue、React、Svelte）
- [ ] 完善文档和教程

### 10.2 中期目标

- [ ] macOS 和 Linux 预编译壳
- [ ] 自动更新功能
- [ ] 系统托盘支持
- [ ] 多窗口支持
- [ ] 插件系统

### 10.3 长期目标

- [ ] 移动端支持（iOS、Android）
- [ ] 更丰富的原生 API
- [ ] 性能优化
- [ ] 社区生态建设

---

**最后更新**：2026-04-20
**版本**：0.1.0
**作者**：Vokex Team
