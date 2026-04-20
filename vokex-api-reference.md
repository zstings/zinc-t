# Vokex API Reference

> Vokex 桌面应用框架 API 参考文档
> 设计风格：扁平化、函数式、Promise-based

---

## 目录

- [1. app](#1-app)
- [2. os](#2-os)
- [3. process](#3-process)
- [4. events](#4-events)

---

## 1. app

应用生命周期管理、元信息。

### 方法

#### `app.isReady()`

应用是否已完成初始化。

```typescript
app.isReady(): Promise<boolean>
```

#### `app.name()`

应用名称。

```typescript
app.name(): Promise<string>
```

#### `app.version()`

应用版本号。

```typescript
app.version(): Promise<string>
```

#### `app.identifier()`

应用标识符。

```typescript
app.identifier(): Promise<string>
```

#### `app.isPackaged()`

是否以打包模式运行。

```typescript
app.isPackaged(): Promise<boolean>
```

#### `app.isNative()`

是否在原生壳中运行。

```typescript
app.isNative(): Promise<boolean>
```

---

## 2. os

操作系统相关 API。

### 方法

#### `os.platform()`

获取操作系统平台。

```typescript
os.platform(): Promise<string>  // 'windows' | 'macos' | 'linux' | etc.
```

#### `os.arch()`

获取系统架构。

```typescript
os.arch(): Promise<string>  // 'x86_64' | 'aarch64' | etc.
```

#### `os.homeDir()`

获取用户主目录。

```typescript
os.homeDir(): Promise<string>
```

#### `os.tempDir()`

获取临时目录。

```typescript
os.tempDir(): Promise<string>
```

#### `os.hostname()`

获取主机名。

```typescript
os.hostname(): Promise<string>
```

---

## 3. process

进程相关 API。

### 方法

#### `process.pid()`

获取当前进程 ID。

```typescript
process.pid(): Promise<number>
```

#### `process.cwd()`

获取当前工作目录。

```typescript
process.cwd(): Promise<string>
```

#### `process.env()`

获取环境变量。

```typescript
process.env(): Promise<Record<string, string>>
```

#### `process.exit()`

退出应用。

```typescript
process.exit(): Promise<void>
```

---

## 4. events

事件监听相关 API。

### 方法

#### `events.on(event, listener)`

监听事件。

```typescript
events.on(event: string, listener: (data: any) => void): void
```

#### `events.off(event, listener)`

取消监听事件。

```typescript
events.off(event: string, listener: (data: any) => void): void
```

#### `events.emit(event, data)`

触发事件（内部使用）。

```typescript
events.emit(event: string, data?: any): void
```

---

## 使用示例

```typescript
import { os, process, app, events } from 'vokex';

// 获取系统信息
const platform = await os.platform();
console.log('Platform:', platform);

// 获取进程 ID
const pid = await process.pid();
console.log('PID:', pid);

// 获取应用信息
const appName = await app.name();
console.log('App Name:', appName);

// 监听事件
events.on('window.resized', ({ width, height }) => {
  console.log(`Window resized: ${width}x${height}`);
});
```

---

## 前端直接使用

在 HTML 中也可以直接通过全局对象调用：

```html
<script type="module">
  // 使用全局 API
  const platform = await window.__VOKEX__.call('os.platform', []);
  console.log('Platform:', platform);
</script>
```

---

**最后更新**：2026-04-20
**版本**：0.1.0
