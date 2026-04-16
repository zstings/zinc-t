/**
 * 'a' 框架 - 运行时 API
 *
 * 前端通过 import 使用：
 * ```ts
 * import { window, fs, dialog, os, process, clipboard } from "a";
 * ```
 *
 * 开发模式（浏览器中）：返回 stub，不报错
 * 生产模式（壳中运行）：调用真正的原生 API
 */

// ============================================================
// 环境检测
// ============================================================

/** 是否在原生壳中运行 */
export const isNative = typeof globalThis !== "undefined" && !!(globalThis as any).__A_NATIVE__;

/** 获取桥接对象 */
function getBridge(): any {
  return (globalThis as any).__A__;
}

/** 调用原生 API */
async function call<T = any>(method: string, ...args: any[]): Promise<T> {
  if (!isNative) {
    console.warn(`[a] "${method}" 仅在原生模式下可用`);
    return undefined as any;
  }
  return getBridge().call(method, ...args);
}

// ============================================================
// Window API
// ============================================================

export const window = {
  /** 关闭窗口 */
  close: () => call("window.close"),

  /** 设置窗口标题 */
  setTitle: (title: string) => call("window.setTitle", title),

  /** 设置窗口大小 */
  setSize: (width: number, height: number) => call("window.setSize", width, height),

  /** 获取窗口大小 */
  getSize: (): Promise<{ width: number; height: number }> =>
    call("window.getSize"),

  /** 设置窗口位置 */
  setPosition: (x: number, y: number) => call("window.setPosition", x, y),

  /** 最小化 */
  minimize: () => call("window.minimize"),

  /** 最大化 */
  maximize: () => call("window.maximize"),

  /** 取消最大化 */
  unmaximize: () => call("window.unmaximize"),

  /** 是否最大化 */
  isMaximized: (): Promise<boolean> => call("window.isMaximized"),

  /** 设置全屏 */
  setFullscreen: (fullscreen: boolean) => call("window.setFullscreen", fullscreen),

  /** 是否全屏 */
  isFullscreen: (): Promise<boolean> => call("window.isFullscreen"),

  /** 设置是否可缩放 */
  setResizable: (resizable: boolean) => call("window.setResizable", resizable),

  /** 设置置顶 */
  setAlwaysOnTop: (top: boolean) => call("window.setAlwaysOnTop", top),

  /** 设置是否可见 */
  setVisible: (visible: boolean) => call("window.setVisible", visible),

  /** 聚焦窗口 */
  setFocus: () => call("window.setFocus"),

  /** 是否聚焦 */
  isFocused: (): Promise<boolean> => call("window.isFocused"),

  /** 获取缩放因子 */
  scaleFactor: (): Promise<number> => call("window.scaleFactor"),

  /** 设置窗口装饰（标题栏、边框） */
  setDecorations: (decorations: boolean) => call("window.setDecorations", decorations),

  /** 开始拖拽窗口（用于自定义标题栏） */
  dragWindow: () => call("window.dragWindow"),

  /** 居中窗口 */
  center: () => call("window.center"),
};

// ============================================================
// FS API
// ============================================================

export const fs = {
  /** 读取文本文件 */
  readTextFile: (path: string): Promise<string> => call("fs.readTextFile", path),

  /** 读取二进制文件（返回 base64） */
  readBinaryFile: (path: string): Promise<string> => call("fs.readBinaryFile", path),

  /** 写入文本文件 */
  writeTextFile: (path: string, content: string): Promise<void> =>
    call("fs.writeTextFile", path, content),

  /** 写入二进制文件（传入 base64） */
  writeBinaryFile: (path: string, contentBase64: string): Promise<void> =>
    call("fs.writeBinaryFile", path, contentBase64),

  /** 读取目录 */
  readDir: (path: string): Promise<Array<{
    name: string;
    path: string;
    isFile: boolean;
    isDir: boolean;
  }>> => call("fs.readDir", path),

  /** 创建目录 */
  createDir: (path: string, recursive?: boolean): Promise<void> =>
    call("fs.createDir", path, recursive),

  /** 删除文件或目录 */
  removeFile: (path: string): Promise<void> => call("fs.removeFile", path),

  /** 检查文件是否存在 */
  exists: (path: string): Promise<boolean> => call("fs.exists", path),

  /** 获取文件信息 */
  stat: (path: string): Promise<{
    isFile: boolean;
    isDir: boolean;
    size: number;
    modified: number | null;
  }> => call("fs.stat", path),

  /** 复制文件 */
  copyFile: (from: string, to: string): Promise<void> => call("fs.copyFile", from, to),

  /** 重命名/移动文件 */
  rename: (from: string, to: string): Promise<void> => call("fs.rename", from, to),

  /** 获取应用数据目录 */
  appDataDir: (): Promise<string> => call("fs.appDataDir"),

  /** 检查嵌入资源是否存在 */
  resourceExists: (path: string): Promise<boolean> => call("fs.resourceExists", path),

  /** 读取嵌入资源（返回 base64） */
  resourceLoad: (path: string): Promise<string> => call("fs.resourceLoad", path),
};

// ============================================================
// App API
// ============================================================

export const app = {
  /** 获取应用配置 */
  getConfig: (): Promise<any> => call("app.getConfig"),

  /** 获取框架版本 */
  version: (): Promise<string> => call("app.version"),
};

// ============================================================
// Dialog API
// ============================================================

export const dialog = {
  /** 打开文件选择对话框（暂未实现） */
  openFile: (options?: any): Promise<string | null> => call("dialog.openFile", options),

  /** 保存文件对话框（暂未实现） */
  saveFile: (options?: any): Promise<string | null> => call("dialog.saveFile", options),

  /** 消息对话框（暂未实现） */
  message: (options: { title?: string; message: string }): Promise<void> =>
    call("dialog.message", options),
};

// ============================================================
// Clipboard API
// ============================================================

export const clipboard = {
  /** 读取剪贴板文本（暂未实现） */
  readText: (): Promise<string> => call("clipboard.readText"),

  /** 写入剪贴板文本（暂未实现） */
  writeText: (text: string): Promise<void> => call("clipboard.writeText", text),
};

// ============================================================
// OS API
// ============================================================

export const os = {
  /** 获取操作系统类型 */
  platform: (): Promise<string> => call("os.platform"),

  /** 获取系统架构 */
  arch: (): Promise<string> => call("os.arch"),

  /** 获取用户主目录 */
  homeDir: (): Promise<string> => call("os.homeDir"),

  /** 获取临时目录 */
  tempDir: (): Promise<string> => call("os.tempDir"),

  /** 获取主机名 */
  hostname: (): Promise<string> => call("os.hostname"),
};

// ============================================================
// Process API
// ============================================================

export const process = {
  /** 获取进程 ID */
  pid: (): Promise<number> => call("process.pid"),

  /** 获取当前工作目录 */
  cwd: (): Promise<string> => call("process.cwd"),

  /** 获取环境变量 */
  env: (key?: string): Promise<string | Record<string, string>> => call("process.env", key),

  /** 退出应用 */
  exit: (code?: number): Promise<void> => call("process.exit", code),
};

// ============================================================
// Event API
// ============================================================

export const events = {
  /** 监听事件 */
  on: (event: string, listener: (event: string, data: any) => void) => {
    if (!isNative) return;
    getBridge().addEventListener(event, listener);
  },

  /** 取消监听 */
  off: (event: string, listener: (event: string, data: any) => void) => {
    if (!isNative) return;
    getBridge().removeEventListener(event, listener);
  },

  /** 监听所有事件 */
  onAny: (listener: (event: string, data: any) => void) => {
    if (!isNative) return;
    getBridge().addEventListener("*", listener);
  },
};

// ============================================================
// 导出
// ============================================================

export default {
  isNative,
  window,
  fs,
  app,
  dialog,
  clipboard,
  os,
  process,
  events,
};
