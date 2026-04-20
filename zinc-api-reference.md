# Zinc API Reference

> Zinc 桌面应用框架 API 参考文档
> 设计风格：扁平化、函数式、Promise-based

---

## 来源标注说明

每个 API 末尾标注来源标签：

| 标签 | 含义 |
|------|------|
| `Niva` | Niva 已实现 |
| `NL` | Neutralinojs 已实现 |
| `Niva+NL` | 两者均已实现 |
| `Electron` | 从 Electron 借鉴设计，两者均未实现 |
| `Zinc` | Zinc 原始设计，两者均未实现 |

---

## 目录

- [1. app](#1-app)
- [2. browserWindow](#2-browserwindow)
- [3. dialog](#3-dialog)
- [4. menu](#4-menu)
- [5. tray](#5-tray)
- [6. clipboard](#6-clipboard)
- [7. notification](#7-notification)
- [8. screen](#8-screen)
- [9. fs](#9-fs)
- [10. shell](#10-shell)
- [11. process](#11-process)
- [12. events](#12-events)
- [13. storage](#13-storage)
- [14. computer](#14-computer)
- [15. http](#15-http)
- [16. shortcut](#16-shortcut)
- [附录：类型定义](#附录类型定义)

---

## 1. app

应用生命周期管理、元信息、行为控制。

### 方法

#### `app.quit()`

退出应用。

```typescript
app.quit(): void
```

`Niva+NL`

#### `app.exit(code)`

立即退出应用，不触发生命周期事件。

```typescript
app.exit(code: number): void
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `code` | `number` | 退出码，默认 `0` |

`Niva+NL`

#### `app.restart()`

重启应用。

```typescript
app.restart(): void
```

`Niva+NL`

#### `app.getAppPath()`

获取应用安装目录路径。

```typescript
app.getAppPath(): string
```

`Niva+NL`

#### `app.getPath(name)`

获取系统特殊目录路径。

```typescript
app.getPath(name: string): string
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 目录名，如 `home`、`appData`、`desktop`、`documents`、`downloads`、`pictures`、`music`、`videos`、`temp`、`exe` |

`Niva+NL`

#### `app.getVersion()`

获取应用版本号（来自 package.json）。

```typescript
app.getVersion(): string
```

`Niva+NL`

#### `app.getName()`

获取应用名称。

```typescript
app.getName(): string
```

`Niva+NL`

#### `app.setName(name)`

设置应用名称。

```typescript
app.setName(name: string): void
```

`Niva+NL`

#### `app.getLocale()`

获取系统语言标识。

```typescript
app.getLocale(): string
```

返回值示例：`zh-CN`、`en-US`

`NL`

#### `app.setDockBadge(text)`

设置 macOS Dock 图标徽标。

```typescript
app.setDockBadge(text: string): void
```

`Electron` — Niva 和 Neutralinojs 均未实现

#### `app.requestSingleInstanceLock()`

请求单实例锁，防止重复启动。

```typescript
app.requestSingleInstanceLock(): boolean
```

返回 `true` 表示当前是首个实例，`false` 表示已有实例运行。

`Electron` — Niva 和 Neutralinojs 均未实现

#### `app.hasSingleInstanceLock()`

检查是否持有单实例锁。

```typescript
app.hasSingleInstanceLock(): boolean
```

`Electron` — Niva 和 Neutralinojs 均未实现

#### `app.setProxy(config)`

设置应用代理。

```typescript
app.setProxy(config: ProxyConfig): void
```

`Electron` — Niva 和 Neutralinojs 均未实现

### 事件

#### `app.on('ready', callback)`

应用初始化完成时触发。

```typescript
app.on('ready', () => void): void
```

`Niva+NL`

#### `app.on('window-all-closed', callback)`

所有窗口关闭时触发。

```typescript
app.on('window-all-closed', () => void): void
```

`Electron` — Niva 和 Neutralinojs 均未实现

#### `app.on('before-quit', callback)`

应用即将退出时触发。

```typescript
app.on('before-quit', () => void): void
```

`Niva+NL`

#### `app.on('second-instance', callback)`

第二个实例启动时触发（需先调用 `requestSingleInstanceLock`）。

```typescript
app.on('second-instance', (argv: string[]) => void): void
```

`Electron` — Niva 和 Neutralinojs 均未实现

#### `app.on('activate', callback)`

macOS 应用被激活时触发（点击 Dock 图标等）。

```typescript
app.on('activate', () => void): void
```

`Electron` — Niva 和 Neutralinojs 均未实现

---

## 2. browserWindow

窗口创建与控制。

### 方法

#### `browserWindow.create(options)`

创建新窗口，返回窗口实例。

```typescript
browserWindow.create(options: WindowOptions): Window
```

`Niva+NL`

#### `browserWindow.getAll()`

获取所有窗口实例。

```typescript
browserWindow.getAll(): Window[]
```

`Niva` — Neutralinojs 不支持多窗口

#### `browserWindow.getFocused()`

获取当前聚焦的窗口。

```typescript
browserWindow.getFocused(): Window | null
```

`Niva` — Neutralinojs 不支持多窗口

### Window 实例方法

#### `win.close()`

关闭窗口。

```typescript
win.close(): void
```

`Niva+NL`

#### `win.show()`

显示窗口。

```typescript
win.show(): void
```

`Niva+NL`

#### `win.hide()`

隐藏窗口。

```typescript
win.hide(): void
```

`Niva+NL`

#### `win.minimize()`

最小化窗口。

```typescript
win.minimize(): void
```

`Niva+NL`

#### `win.maximize()`

最大化窗口。

```typescript
win.maximize(): void
```

`Niva+NL`

#### `win.unmaximize()`

取消最大化。

```typescript
win.unmaximize(): void
```

`Niva+NL`

#### `win.restore()`

从最小化恢复。

```typescript
win.restore(): void
```

`Niva+NL`

#### `win.focus()`

聚焦窗口。

```typescript
win.focus(): void
```

`Niva+NL`

#### `win.blur()`

取消聚焦。

```typescript
win.blur(): void
```

`Niva` — Neutralinojs 未实现

#### `win.isMaximized()`

是否最大化。

```typescript
win.isMaximized(): boolean
```

`Niva+NL`

#### `win.isMinimized()`

是否最小化。

```typescript
win.isMinimized(): boolean
```

`Niva+NL`

#### `win.isFullScreen()`

是否全屏。

```typescript
win.isFullScreen(): boolean
```

`Niva+NL`

#### `win.setFullScreen(flag)`

设置全屏状态。

```typescript
win.setFullScreen(flag: boolean): void
```

`Niva+NL`

#### `win.setTitle(title)`

设置窗口标题。

```typescript
win.setTitle(title: string): void
```

`Niva+NL`

#### `win.getTitle()`

获取窗口标题。

```typescript
win.getTitle(): string
```

`Niva+NL`

#### `win.setSize(width, height)`

设置窗口尺寸。

```typescript
win.setSize(width: number, height: number): void
```

`Niva+NL`

#### `win.getSize()`

获取窗口尺寸。

```typescript
win.getSize(): [number, number]
```

返回 `[width, height]`。

`Niva+NL`

#### `win.setMinimumSize(width, height)`

设置最小窗口尺寸。

```typescript
win.setMinimumSize(width: number, height: number): void
```

`Niva+NL`

#### `win.setMaximumSize(width, height)`

设置最大窗口尺寸。

```typescript
win.setMaximumSize(width: number, height: number): void
```

`Niva+NL`

#### `win.setResizable(flag)`

设置窗口是否可调整大小。

```typescript
win.setResizable(flag: boolean): void
```

`Niva+NL`

#### `win.setAlwaysOnTop(flag)`

设置窗口是否置顶。

```typescript
win.setAlwaysOnTop(flag: boolean): void
```

`Niva+NL`

#### `win.setPosition(x, y)`

设置窗口位置。

```typescript
win.setPosition(x: number, y: number): void
```

`Niva+NL`

#### `win.getPosition()`

获取窗口位置。

```typescript
win.getPosition(): [number, number]
```

返回 `[x, y]`。

`Niva+NL`

#### `win.center()`

将窗口居中到屏幕。

```typescript
win.center(): void
```

`Niva+NL`

#### `win.setOpacity(opacity)`

设置窗口透明度。

```typescript
win.setOpacity(opacity: number): void
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `opacity` | `number` | 透明度，范围 `0.0` ~ `1.0` |

`Electron` — Niva 和 Neutralinojs 均未实现

#### `win.setBackgroundColor(color)`

设置窗口背景色。

```typescript
win.setBackgroundColor(color: string): void
```

`Electron` — Niva 和 Neutralinojs 均未实现

#### `win.setIcon(icon)`

设置窗口图标。

```typescript
win.setIcon(icon: string): void
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `icon` | `string` | 图标文件路径（PNG/ICO） |

`Niva+NL`

#### `win.loadFile(path)`

加载本地 HTML 文件。

```typescript
win.loadFile(path: string): void
```

`Niva+NL`

#### `win.loadURL(url)`

加载远程 URL。

```typescript
win.loadURL(url: string): void
```

`Niva+NL`

#### `win.reload()`

重新加载当前页面。

```typescript
win.reload(): void
```

`Niva+NL`

#### `win.setProgressBar(progress)`

设置任务栏进度条（Windows/macOS）。

```typescript
win.setProgressBar(progress: number): void
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `progress` | `number` | 进度值，范围 `0.0` ~ `1.0`，设为 `-1` 隐藏进度条 |

`Electron` — Niva 和 Neutralinojs 均未实现

#### `win.setSkipTaskbar(flag)`

设置是否在任务栏中显示。

```typescript
win.setSkipTaskbar(flag: boolean): void
```

`Electron` — Niva 和 Neutralinojs 均未实现

#### `win.capturePage()`

截取窗口内容。

```typescript
win.capturePage(): Promise<string>
```

返回 base64 编码的 PNG 图片。

`Electron` — Niva 和 Neutralinojs 均未实现

### Window 事件

#### `win.on('close', callback)`

窗口即将关闭时触发。

```typescript
win.on('close', () => void): void
```

`Niva+NL`

#### `win.on('resize', callback)`

窗口尺寸变化时触发。

```typescript
win.on('resize', () => void): void
```

`Niva+NL`

#### `win.on('move', callback)`

窗口位置变化时触发。

```typescript
win.on('move', () => void): void
```

`Niva` — Neutralinojs 未实现

#### `win.on('minimize', callback)`

窗口最小化时触发。

```typescript
win.on('minimize', () => void): void
```

`Niva+NL`

#### `win.on('maximize', callback)`

窗口最大化时触发。

```typescript
win.on('maximize', () => void): void
```

`Niva+NL`

#### `win.on('focus', callback)`

窗口获得焦点时触发。

```typescript
win.on('focus', () => void): void
```

`Niva+NL`

#### `win.on('blur', callback)`

窗口失去焦点时触发。

```typescript
win.on('blur', () => void): void
```

`Niva` — Neutralinojs 未实现

#### `win.on('enter-full-screen', callback)`

进入全屏时触发。

```typescript
win.on('enter-full-screen', () => void): void
```

`Niva+NL`

#### `win.on('leave-full-screen', callback)`

退出全屏时触发。

```typescript
win.on('leave-full-screen', () => void): void
```

`Niva+NL`

---

## 3. dialog

原生对话框。

### 方法

#### `dialog.showOpenDialog(options)`

显示文件选择对话框。

```typescript
dialog.showOpenDialog(options?: OpenDialogOptions): Promise<string[]>
```

返回选中的文件路径数组。

`Niva+NL`

#### `dialog.showSaveDialog(options)`

显示文件保存对话框。

```typescript
dialog.showSaveDialog(options?: SaveDialogOptions): Promise<string>
```

返回保存路径，取消返回空字符串。

`Niva+NL`

#### `dialog.showMessageBox(options)`

显示消息对话框。

```typescript
dialog.showMessageBox(options: MessageBoxOptions): Promise<number>
```

返回用户点击的按钮索引。

`Niva+NL`

#### `dialog.showErrorBox(title, content)`

显示错误对话框（同步）。

```typescript
dialog.showErrorBox(title: string, content: string): void
```

`Electron` — Niva 和 Neutralinojs 均未实现

#### `dialog.showColorDialog(options)`

显示颜色选择对话框。

```typescript
dialog.showColorDialog(options?: ColorDialogOptions): Promise<string>
```

返回选中的颜色值（HEX 格式），如 `#FF5500`。

`Zinc` — 原始设计，两者均未实现

---

## 4. menu

原生菜单管理。

### 方法

#### `menu.setApplicationMenu(template)`

设置应用菜单栏。

```typescript
menu.setApplicationMenu(template: MenuItem[]): void
```

`Niva` — Neutralinojs 未实现

#### `menu.setContextMenu(template)`

设置右键上下文菜单。

```typescript
menu.setContextMenu(template: MenuItem[]): void
```

`Niva` — Neutralinojs 未实现

#### `menu.removeContextMenu()`

移除右键上下文菜单。

```typescript
menu.removeContextMenu(): void
```

`Niva` — Neutralinojs 未实现

#### `menu.sendAction(action)`

向应用发送菜单动作（macOS）。

```typescript
menu.sendAction(action: string): void
```

`Electron` — Niva 和 Neutralinojs 均未实现

---

## 5. tray

系统托盘图标管理。

### 方法

#### `tray.create(options)`

创建系统托盘图标。

```typescript
tray.create(options: TrayOptions): Tray
```

`Niva` — Neutralinojs 未实现

#### `tray.setToolTip(text)`

设置鼠标悬停提示文本。

```typescript
tray.setToolTip(text: string): void
```

`Niva` — Neutralinojs 未实现

#### `tray.setTitle(title)`

设置托盘标题（macOS）。

```typescript
tray.setTitle(title: string): void
```

`Niva` — Neutralinojs 未实现

#### `tray.setMenu(template)`

设置托盘右键菜单。

```typescript
tray.setMenu(template: MenuItem[]): void
```

`Niva` — Neutralinojs 未实现

#### `tray.setImage(icon)`

设置托盘图标。

```typescript
tray.setImage(icon: string): void
```

`Niva` — Neutralinojs 未实现

#### `tray.destroy()`

销毁托盘图标。

```typescript
tray.destroy(): void
```

`Niva` — Neutralinojs 未实现

#### `tray.displayBalloon(options)`

显示系统气泡通知（Windows）。

```typescript
tray.displayBalloon(options: BalloonOptions): void
```

`Zinc` — 原始设计，Niva 部分支持，Neutralinojs 未实现

### Tray 事件

#### `tray.on('click', callback)`

托盘图标被点击。

```typescript
tray.on('click', () => void): void
```

`Niva` — Neutralinojs 未实现

#### `tray.on('right-click', callback)`

托盘图标被右键点击。

```typescript
tray.on('right-click', () => void): void
```

`Niva` — Neutralinojs 未实现

#### `tray.on('double-click', callback)`

托盘图标被双击。

```typescript
tray.on('double-click', () => void): void
```

`Niva` — Neutralinojs 未实现

---

## 6. clipboard

系统剪贴板读写。

### 方法

#### `clipboard.readText()`

读取剪贴板文本。

```typescript
clipboard.readText(): string
```

`Niva+NL`

#### `clipboard.writeText(text)`

写入文本到剪贴板。

```typescript
clipboard.writeText(text: string): void
```

`Niva+NL`

#### `clipboard.readImage()`

读取剪贴板图片。

```typescript
clipboard.readImage(): string
```

返回 base64 编码的 PNG 图片。

`Niva` — Neutralinojs 未实现

#### `clipboard.writeImage(image)`

写入图片到剪贴板。

```typescript
clipboard.writeImage(image: string): void
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `image` | `string` | base64 编码的 PNG 图片 |

`Niva` — Neutralinojs 未实现

#### `clipboard.readHTML()`

读取剪贴板 HTML 内容。

```typescript
clipboard.readHTML(): string
```

`Electron` — Niva 和 Neutralinojs 均未实现

#### `clipboard.writeHTML(html)`

写入 HTML 到剪贴板。

```typescript
clipboard.writeHTML(html: string): void
```

`Electron` — Niva 和 Neutralinojs 均未实现

#### `clipboard.hasText()`

检查剪贴板是否包含文本。

```typescript
clipboard.hasText(): boolean
```

`Zinc` — 原始设计，两者均未实现

#### `clipboard.clear()`

清空剪贴板。

```typescript
clipboard.clear(): void
```

`Niva+NL`

---

## 7. notification

系统通知。

### 方法

#### `notification.show(options)`

发送系统通知。

```typescript
notification.show(options: NotificationOptions): void
```

`Niva+NL`

#### `notification.isSupported()`

检查系统是否支持通知。

```typescript
notification.isSupported(): boolean
```

`Electron` — Niva 和 Neutralinojs 均未实现

---

## 8. screen

屏幕与显示器信息。

### 方法

#### `screen.getAllDisplays()`

获取所有显示器信息。

```typescript
screen.getAllDisplays(): Display[]
```

`Niva` — Neutralinojs 未实现

#### `screen.getPrimaryDisplay()`

获取主显示器信息。

```typescript
screen.getPrimaryDisplay(): Display
```

`Niva` — Neutralinojs 未实现

#### `screen.getCursorScreenPoint()`

获取光标在屏幕上的坐标。

```typescript
screen.getCursorScreenPoint(): { x: number, y: number }
```

`Electron` — Niva 和 Neutralinojs 均未实现

---

## 9. fs

文件系统操作。

### 方法

#### `fs.readFile(path)`

读取文本文件。

```typescript
fs.readFile(path: string): Promise<string>
```

`Niva+NL`

#### `fs.readFileBinary(path)`

读取二进制文件。

```typescript
fs.readFileBinary(path: string): Promise<Uint8Array>
```

`Niva` — Neutralinojs 未实现

#### `fs.writeFile(path, data)`

写入文本文件。

```typescript
fs.writeFile(path: string, data: string): Promise<void>
```

`Niva+NL`

#### `fs.appendFile(path, data)`

追加内容到文件。

```typescript
fs.appendFile(path: string, data: string): Promise<void>
```

`Niva+NL`

#### `fs.deleteFile(path)`

删除文件。

```typescript
fs.deleteFile(path: string): Promise<void>
```

`Niva+NL`

#### `fs.readDir(path)`

读取目录内容。

```typescript
fs.readDir(path: string): Promise<DirEntry[]>
```

`Niva+NL`

#### `fs.createDir(path)`

创建目录（支持递归创建）。

```typescript
fs.createDir(path: string): Promise<void>
```

`Niva+NL`

#### `fs.removeDir(path)`

删除目录（支持递归删除）。

```typescript
fs.removeDir(path: string): Promise<void>
```

`Niva+NL`

#### `fs.stat(path)`

获取文件/目录信息。

```typescript
fs.stat(path: string): Promise<FileInfo>
```

`Niva+NL`

#### `fs.exists(path)`

检查路径是否存在。

```typescript
fs.exists(path: string): Promise<boolean>
```

`Niva+NL`

#### `fs.copyFile(source, destination)`

复制文件。

```typescript
fs.copyFile(source: string, destination: string): Promise<void>
```

`Niva+NL`

#### `fs.moveFile(source, destination)`

移动/重命名文件。

```typescript
fs.moveFile(source: string, destination: string): Promise<void>
```

`Niva+NL`

#### `fs.watch(path)`

监听文件/目录变化。

```typescript
fs.watch(path: string): Watcher
```

`Zinc` — 原始设计，两者均未实现（实现难度 ⭐⭐⭐⭐）

---

## 10. shell

系统命令与外部程序。

### 方法

#### `shell.openExternal(url)`

用系统默认浏览器打开 URL。

```typescript
shell.openExternal(url: string): void
```

`Niva+NL`

#### `shell.openPath(path)`

用系统默认程序打开文件/目录。

```typescript
shell.openPath(path: string): void
```

`Niva+NL`

#### `shell.execCommand(command, options?)`

执行系统命令。

```typescript
shell.execCommand(command: string, options?: ExecOptions): Promise<ShellResult>
```

`Niva+NL`

#### `shell.trashItem(path)`

将文件移到回收站。

```typescript
shell.trashItem(path: string): void
```

`Electron` — Niva 和 Neutralinojs 均未实现

---

## 11. process

进程信息与控制。

### 方法

#### `process.getPid()`

获取当前进程 ID。

```typescript
process.getPid(): number
```

`Niva+NL`

#### `process.getArgv()`

获取命令行参数。

```typescript
process.getArgv(): string[]
```

`Niva+NL`

#### `process.getEnv(key)`

获取环境变量。

```typescript
process.getEnv(key: string): string | undefined
```

`Niva+NL`

#### `process.getPlatform()`

获取操作系统平台。

```typescript
process.getPlatform(): string
```

返回值：`windows`、`macos`、`linux`

`Niva+NL`

#### `process.getArch()`

获取系统架构。

```typescript
process.getArch(): string
```

返回值：`x64`、`arm64`

`Niva+NL`

#### `process.getUptime()`

获取进程运行时长（秒）。

```typescript
process.getUptime(): number
```

`Electron` — Niva 和 Neutralinojs 均未实现

#### `process.getCpuUsage()`

获取进程 CPU 使用率。

```typescript
process.getCpuUsage(): CpuUsage
```

`Electron` — Niva 和 Neutralinojs 均未实现

#### `process.getMemoryInfo()`

获取进程内存信息。

```typescript
process.getMemoryInfo(): MemoryInfo
```

`NL` — Neutralinojs 有类似的 `getMemoryInfo`，Niva 未实现

#### `process.exit(code)`

退出当前进程。

```typescript
process.exit(code?: number): void
```

`Niva+NL`

#### `process.kill(pid, signal?)`

终止指定进程。

```typescript
process.kill(pid: number, signal?: string): void
```

`NL` — Neutralinojs 有 `os.killProcess`，Niva 未实现

### 事件

#### `process.on('exit', callback)`

进程即将退出时触发。

```typescript
process.on('exit', (code: number) => void): void
```

`Niva+NL`

---

## 12. events

全局事件总线。

### 方法

#### `events.emit(channel, ...args)`

发送事件。

```typescript
events.emit(channel: string, ...args: any[]): void
```

`Niva+NL`

#### `events.on(channel, callback)`

监听事件。

```typescript
events.on(channel: string, callback: (...args: any[]) => void): void
```

`Niva+NL`

#### `events.once(channel, callback)`

监听事件（仅触发一次）。

```typescript
events.once(channel: string, callback: (...args: any[]) => void): void
```

`Niva+NL`

#### `events.off(channel, callback)`

移除事件监听。

```typescript
events.off(channel: string, callback: (...args: any[]) => void): void
```

`Niva+NL`

#### `events.removeAllListeners(channel?)`

移除指定频道的所有监听，不传参数则移除全部。

```typescript
events.removeAllListeners(channel?: string): void
```

`Niva` — Neutralinojs 未实现

---

## 13. storage

持久化键值对存储。

### 方法

#### `storage.setData(key, value)`

存储数据。

```typescript
storage.setData(key: string, value: any): Promise<void>
```

`value` 会自动序列化为 JSON。

`NL` — Neutralinojs 有 `storage.setData`，Niva 未实现

#### `storage.getData(key)`

读取数据。

```typescript
storage.getData(key: string): Promise<any>
```

`NL` — Neutralinojs 有 `storage.getData`，Niva 未实现

#### `storage.getKeys()`

获取所有键名。

```typescript
storage.getKeys(): Promise<string[]>
```

`NL` — Neutralinojs 有 `storage.getKeys`，Niva 未实现

#### `storage.has(key)`

检查键是否存在。

```typescript
storage.has(key: string): Promise<boolean>
```

`Zinc` — 原始设计，两者均未实现

#### `storage.removeData(key)`

删除指定键。

```typescript
storage.removeData(key: string): Promise<void>
```

`NL` — Neutralinojs 有 `storage.removeData`，Niva 未实现

#### `storage.clear()`

清空所有存储。

```typescript
storage.clear(): Promise<void>
```

`NL` — Neutralinojs 有 `storage.clear`，Niva 未实现

---

## 14. computer

系统硬件与系统信息。

### 方法

#### `computer.getCpuInfo()`

获取 CPU 信息。

```typescript
computer.getCpuInfo(): Promise<CpuInfo>
```

`Niva+NL`

#### `computer.getMemoryInfo()`

获取系统内存信息。

```typescript
computer.getMemoryInfo(): Promise<MemoryInfo>
```

`Niva+NL`

#### `computer.getOsInfo()`

获取操作系统信息。

```typescript
computer.getOsInfo(): Promise<OsInfo>
```

`Niva+NL`

#### `computer.getDisplays()`

获取显示器列表。

```typescript
computer.getDisplays(): Promise<Display[]>
```

`Niva+NL`

#### `computer.getMousePosition()`

获取鼠标当前位置。

```typescript
computer.getMousePosition(): Promise<{ x: number, y: number }>
```

`Niva+NL`

#### `computer.getKeyboardLayout()`

获取当前键盘布局。

```typescript
computer.getKeyboardLayout(): Promise<string>
```

`Zinc` — 原始设计，两者均未实现

---

## 15. http

HTTP/HTTPS 网络请求。

### 方法

#### `http.get(url, options?)`

发起 GET 请求。

```typescript
http.get(url: string, options?: RequestOptions): Promise<HttpResponse>
```

`Niva` — Neutralinojs 未实现

#### `http.post(url, data, options?)`

发起 POST 请求。

```typescript
http.post(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse>
```

`Niva` — Neutralinojs 未实现

#### `http.put(url, data, options?)`

发起 PUT 请求。

```typescript
http.put(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse>
```

`Niva` — Neutralinojs 未实现

#### `http.delete(url, options?)`

发起 DELETE 请求。

```typescript
http.delete(url: string, options?: RequestOptions): Promise<HttpResponse>
```

`Niva` — Neutralinojs 未实现

#### `http.request(options)`

发起自定义请求。

```typescript
http.request(options: RequestOptions): Promise<HttpResponse>
```

`Niva` — Neutralinojs 未实现

---

## 16. shortcut

全局快捷键。

### 方法

#### `shortcut.register(accelerator, callback)`

注册全局快捷键。

```typescript
shortcut.register(accelerator: string, callback: () => void): void
```

`accelerator` 格式示例：`CommandOrControl+Shift+K`、`Alt+F4`

`Niva` — Neutralinojs 未实现

#### `shortcut.unregister(accelerator)`

注销全局快捷键。

```typescript
shortcut.unregister(accelerator: string): void
```

`Niva` — Neutralinojs 未实现

#### `shortcut.isRegistered(accelerator)`

检查快捷键是否已注册。

```typescript
shortcut.isRegistered(accelerator: string): boolean
```

`Niva` — Neutralinojs 未实现

#### `shortcut.unregisterAll()`

注销所有全局快捷键。

```typescript
shortcut.unregisterAll(): void
```

`Niva` — Neutralinojs 未实现

---

## 附录：类型定义

### WindowOptions

```typescript
interface WindowOptions {
  title?: string
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  x?: number
  y?: number
  center?: boolean
  resizable?: boolean
  movable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  closable?: boolean
  alwaysOnTop?: boolean
  fullscreen?: boolean
  transparent?: boolean
  opacity?: number
  backgroundColor?: string
  icon?: string
  show?: boolean
  frame?: boolean
  titleBarStyle?: 'default' | 'hidden' | 'hiddenInset'
  autoHideMenuBar?: boolean
  webPreferences?: WebPreferences
}
```

### WebPreferences

```typescript
interface WebPreferences {
  devTools?: boolean
  zoomFactor?: number
  javascript?: boolean
}
```

### MenuItem

```typescript
interface MenuItem {
  label?: string
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio'
  click?: () => void
  accelerator?: string
  enabled?: boolean
  checked?: boolean
  submenu?: MenuItem[]
  icon?: string
}
```

### TrayOptions

```typescript
interface TrayOptions {
  icon: string
  tooltip?: string
  menu?: MenuItem[]
}
```

### BalloonOptions

```typescript
interface BalloonOptions {
  title: string
  content: string
  icon?: string
}
```

### OpenDialogOptions

```typescript
interface OpenDialogOptions {
  title?: string
  defaultPath?: string
  filters?: FileFilter[]
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>
}
```

### SaveDialogOptions

```typescript
interface SaveDialogOptions {
  title?: string
  defaultPath?: string
  filters?: FileFilter[]
}
```

### MessageBoxOptions

```typescript
interface MessageBoxOptions {
  type?: 'none' | 'info' | 'warning' | 'error'
  title?: string
  message: string
  detail?: string
  buttons?: string[]
  defaultId?: number
  cancelId?: number
}
```

### ColorDialogOptions

```typescript
interface ColorDialogOptions {
  title?: string
  defaultColor?: string
}
```

### NotificationOptions

```typescript
interface NotificationOptions {
  title: string
  body: string
  icon?: string
  silent?: boolean
  onClick?: () => void
}
```

### FileFilter

```typescript
interface FileFilter {
  name: string
  extensions: string[]
}
```

### Display

```typescript
interface Display {
  id: number
  bounds: { x: number, y: number, width: number, height: number }
  workArea: { x: number, y: number, width: number, height: number }
  size: { width: number, height: number }
  scaleFactor: number
  rotation: number
}
```

### FileInfo

```typescript
interface FileInfo {
  name: string
  path: string
  isFile: boolean
  isDir: boolean
  size: number
  createdAt: number
  modifiedAt: number
  accessedAt: number
}
```

### DirEntry

```typescript
interface DirEntry {
  name: string
  path: string
  isFile: boolean
  isDir: boolean
}
```

### Watcher

```typescript
interface Watcher {
  close(): void
  on(event: 'change', callback: (event: string, path: string) => void): void
  on(event: 'error', callback: (error: Error) => void): void
}
```

### ShellResult

```typescript
interface ShellResult {
  stdout: string
  stderr: string
  code: number
}
```

### ExecOptions

```typescript
interface ExecOptions {
  cwd?: string
  env?: Record<string, string>
  timeout?: number
}
```

### CpuUsage

```typescript
interface CpuUsage {
  percent: number
}
```

### MemoryInfo

```typescript
interface MemoryInfo {
  total: number
  free: number
  used: number
}
```

### CpuInfo

```typescript
interface CpuInfo {
  modelName: string
  cores: number
  logicalCores: number
  usage: number
}
```

### OsInfo

```typescript
interface OsInfo {
  name: string
  version: string
  arch: string
  hostname: string
}
```

### ProxyConfig

```typescript
interface ProxyConfig {
  proxyRules: string
  pacScript?: string
  proxyBypassRules?: string
}
```

### RequestOptions

```typescript
interface RequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: any
  timeout?: number
}
```

### HttpResponse

```typescript
interface HttpResponse {
  statusCode: number
  headers: Record<string, string>
  body: string
}
```
