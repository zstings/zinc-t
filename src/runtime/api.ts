/**
 * vokex 框架 - 友好的 API 封装
 *
 * 提供类似 import { os } from 'vokex' 的调用方式
 */

// 内部调用函数
function vokexCall(method: string, args: any[] = []): Promise<any> {
  const vokex = (window as any).__VOKEX__;
  if (!vokex?.call) {
    console.warn(`[vokex] 此 API 仅在原生模式下可用`);
    return Promise.resolve(undefined);
  }
  return vokex.call(method, args);
}

/**
 * 窗口相关 API
 */
export const browserWindow = {
  // TODO: 实现 window API
};

/**
 * DirEntry 目录项
 */
export interface DirEntry {
  /** 文件名 */
  name: string;
  /** 完整路径 */
  path: string;
  /** 是否是目录 */
  isDir: boolean;
}

/**
 * FileInfo 文件信息
 */
export interface FileInfo {
  /** 是否是文件 */
  isFile: boolean;
  /** 是否是目录 */
  isDir: boolean;
  /** 文件大小（字节） */
  size: number;
  /** 最后修改时间（距现在秒数） */
  modified?: number;
}

/**
 * 文件系统 API 接口
 */
export interface FsAPI {
  /** 读取文本文件 */
  readFile: (path: string) => Promise<string>;
  /** 读取二进制文件 */
  readFileBinary: (path: string) => Promise<Uint8Array>;
  /** 写入文本文件 */
  writeFile: (path: string, data: string) => Promise<void>;
  /** 追加内容到文件 */
  appendFile: (path: string, data: string) => Promise<void>;
  /** 删除文件 */
  deleteFile: (path: string) => Promise<void>;
  /** 读取目录内容 */
  readDir: (path: string) => Promise<DirEntry[]>;
  /** 创建目录（支持递归创建） */
  createDir: (path: string) => Promise<void>;
  /** 删除目录（支持递归删除） */
  removeDir: (path: string) => Promise<void>;
  /** 获取文件/目录信息 */
  stat: (path: string) => Promise<FileInfo>;
  /** 检查路径是否存在 */
  exists: (path: string) => Promise<boolean>;
  /** 复制文件 */
  copyFile: (source: string, destination: string) => Promise<void>;
  /** 移动/重命名文件 */
  moveFile: (source: string, destination: string) => Promise<void>;
  /** 监听文件/目录变化 */
  watch: (path: string) => any;
}

/**
 * 文件系统相关 API
 */
export const fs: FsAPI = {
  /** 读取文本文件 */
  readFile: (path: string): Promise<string> => vokexCall('fs.readFile', [path]),

  /** 读取二进制文件 */
  readFileBinary: (path: string): Promise<Uint8Array> => vokexCall('fs.readFileBinary', [path]),

  /** 写入文本文件 */
  writeFile: (path: string, data: string): Promise<void> => vokexCall('fs.writeFile', [path, data]),

  /** 追加内容到文件 */
  appendFile: (path: string, data: string): Promise<void> => vokexCall('fs.appendFile', [path, data]),

  /** 删除文件 */
  deleteFile: (path: string): Promise<void> => vokexCall('fs.deleteFile', [path]),

  /** 读取目录内容 */
  readDir: (path: string): Promise<DirEntry[]> => vokexCall('fs.readDir', [path]),

  /** 创建目录（支持递归创建） */
  createDir: (path: string): Promise<void> => vokexCall('fs.createDir', [path]),

  /** 删除目录（支持递归删除） */
  removeDir: (path: string): Promise<void> => vokexCall('fs.removeDir', [path]),

  /** 获取文件/目录信息 */
  stat: (path: string): Promise<FileInfo> => vokexCall('fs.stat', [path]),

  /** 检查路径是否存在 */
  exists: (path: string): Promise<boolean> => vokexCall('fs.exists', [path]),

  /** 复制文件 */
  copyFile: (source: string, destination: string): Promise<void> => vokexCall('fs.copyFile', [source, destination]),

  /** 移动/重命名文件 */
  moveFile: (source: string, destination: string): Promise<void> => vokexCall('fs.moveFile', [source, destination]),

  /** 监听文件/目录变化 */
  watch: (path: string): any => vokexCall('fs.watch', [path]),
};

/**
 * ProxyConfig 接口
 */
export interface ProxyConfig {
  proxyRules: string;
  pacScript?: string;
  proxyBypassRules?: string;
}

/**
 * App 事件类型
 */
export type AppEvent = 'ready' | 'window-all-closed' | 'before-quit' | 'second-instance' | 'activate';

/**
 * App API 接口
 */
export interface AppAPI {
  /** 退出应用 */
  quit: () => Promise<void>;
  /** 立即退出应用，不触发生命周期事件 */
  exit: (code?: number) => Promise<void>;
  /** 重启应用 */
  restart: () => Promise<void>;
  /** 获取应用安装目录路径 */
  getAppPath: () => Promise<string>;
  /** 获取系统特殊目录路径 */
  getPath: (name: string) => Promise<string>;
  /** 获取应用版本号（来自 package.json） */
  getVersion: () => Promise<string>;
  /** 获取应用名称 */
  getName: () => Promise<string>;
  /** 设置应用名称（该功能实现待定） */
  setName: (name: string) => Promise<void>;
  /** 获取系统语言标识，如 zh-CN、en-US */
  getLocale: () => Promise<string>;
  /** 设置 macOS Dock 图标徽标（该功能实现待定） */
  setDockBadge: (text: string) => Promise<void>;
  /** 请求单实例锁，防止重复启动 */
  requestSingleInstanceLock: () => Promise<boolean>;
  /** 设置应用代理（该功能实现待定） */
  setProxy: (config: ProxyConfig) => Promise<void>;
  /** 监听应用事件 */
  on: (event: AppEvent, callback: (data?: any) => void) => void;
}

/**
 * 应用相关 API
 */
export const app: AppAPI = {
  /**
   * 退出应用
   */
  quit: (): Promise<void> => vokexCall('app.quit'),

  /**
   * 立即退出应用，不触发生命周期事件
   */
  exit: (code: number = 0): Promise<void> => vokexCall('app.exit', [code]),

  /**
   * 重启应用
   */
  restart: (): Promise<void> => vokexCall('app.restart'),

  /**
   * 获取应用安装目录路径
   */
  getAppPath: (): Promise<string> => vokexCall('app.getAppPath'),

  /**
   * 获取系统特殊目录路径
   * @param name 目录名，如 home、appData、desktop、documents、downloads、pictures、music、videos、temp、exe
   */
  getPath: (name: string): Promise<string> => vokexCall('app.getPath', [name]),

  /**
   * 获取应用版本号（来自 package.json）
   */
  getVersion: (): Promise<string> => vokexCall('app.getVersion'),

  /**
   * 获取应用名称
   */
  getName: (): Promise<string> => vokexCall('app.getName'),

  /**
   * 设置应用名称
   */
  setName: (name: string): Promise<void> => vokexCall('app.setName', [name]),

  /**
   * 获取系统语言标识，如 zh-CN、en-US
   */
  getLocale: (): Promise<string> => vokexCall('app.getLocale'),

  /**
   * 设置 macOS Dock 图标徽标
   */
  setDockBadge: (text: string): Promise<void> => vokexCall('app.setDockBadge', [text]),

  /**
   * 请求单实例锁，防止重复启动
   * @returns true 表示当前是首个实例，false 表示已有实例运行
   */
  requestSingleInstanceLock: (): Promise<boolean> => vokexCall('app.requestSingleInstanceLock'),

  /**
   * 设置应用代理
   */
  setProxy: (config: ProxyConfig): Promise<void> => vokexCall('app.setProxy', [config]),

  /**
   * 监听应用事件
   */
  on: (event: 'ready' | 'window-all-closed' | 'before-quit' | 'second-instance' | 'activate', callback: (data?: any) => void): void => {
    events.on(`app.${event}`, callback);
  },
};

/**
 * 操作系统相关 API
 */
export const os = {
  /**
   * 获取操作系统平台
   * @returns 'windows' | 'macos' | 'linux' | etc.
   */
  platform: (): Promise<string> => vokexCall('os.platform'),

  /**
   * 获取系统架构
   * @returns 'x86_64' | 'aarch64' | etc.
   */
  arch: (): Promise<string> => vokexCall('os.arch'),

  /**
   * 获取用户主目录
   */
  homeDir: (): Promise<string> => vokexCall('os.homeDir'),

  /**
   * 获取临时目录
   */
  tempDir: (): Promise<string> => vokexCall('os.tempDir'),

  /**
   * 获取主机名
   */
  hostname: (): Promise<string> => vokexCall('os.hostname'),
};

/**
 * CpuUsage 进程 CPU 使用率
 */
export interface CpuUsage {
  user: number;
  system: number;
}

/**
 * MemoryInfo 进程内存信息
 */
export interface MemoryInfo {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
}

/**
 * 进程 API 接口
 */
export interface ProcessAPI {
  /** 获取当前进程 ID */
  getPid: () => Promise<number>;
  /** 获取命令行参数 */
  getArgv: () => Promise<string[]>;
  /** 获取环境变量 */
  getEnv: (key: string) => Promise<string | undefined>;
  /** 获取操作系统平台 */
  getPlatform: () => Promise<string>;
  /** 获取系统架构 */
  getArch: () => Promise<string>;
  /** 获取进程运行时长 */
  getUptime: () => Promise<number>;
  /** 获取进程 CPU 使用率 */
  getCpuUsage: () => Promise<CpuUsage>;
  /** 获取进程内存信息 */
  getMemoryInfo: () => Promise<MemoryInfo>;
  /** 获取当前工作目录 */
  cwd: () => Promise<string>;
  /** 获取所有环境变量 */
  env: () => Promise<Record<string, string>>;
  /** 退出当前进程 */
  exit: (code?: number) => Promise<void>;
  /** 终止指定进程 */
  kill: (pid: number, signal?: string) => Promise<void>;
}

/**
 * 进程相关 API
 */
export const process: ProcessAPI = {
  /**
   * 获取当前进程 ID
   */
  getPid: (): Promise<number> => vokexCall('process.getPid'),

  /**
   * 获取命令行参数
   */
  getArgv: (): Promise<string[]> => vokexCall('process.getArgv'),

  /**
   * 获取环境变量
   */
  getEnv: (key: string): Promise<string | undefined> => vokexCall('process.getEnv', [key]),

  /**
   * 获取操作系统平台
   * @returns 'windows' | 'macos' | 'linux'
   */
  getPlatform: (): Promise<string> => vokexCall('process.getPlatform'),

  /**
   * 获取系统架构
   * @returns 'x64' | 'arm64'
   */
  getArch: (): Promise<string> => vokexCall('process.getArch'),

  /**
   * 获取进程运行时长
   */
  getUptime: (): Promise<number> => vokexCall('process.getUptime'),

  /**
   * 获取进程 CPU 使用率
   */
  getCpuUsage: (): Promise<CpuUsage> => vokexCall('process.getCpuUsage'),

  /**
   * 获取进程内存信息
   */
  getMemoryInfo: (): Promise<MemoryInfo> => vokexCall('process.getMemoryInfo'),

  /**
   * 获取当前工作目录
   */
  cwd: (): Promise<string> => vokexCall('process.cwd'),

  /**
   * 获取所有环境变量
   */
  env: (): Promise<Record<string, string>> => vokexCall('process.env'),

  /**
   * 退出当前进程
   */
  exit: (code: number = 0): Promise<void> => vokexCall('process.exit', [code]),

  /**
   * 终止指定进程
   */
  kill: (pid: number, signal?: string): Promise<void> => vokexCall('process.kill', [pid, signal]),
};

/**
 * 对话框相关 API
 */
export const dialog = {
  // TODO: 实现 dialog API
};

/**
 * 剪贴板相关 API
 */
export const clipboard = {
  // TODO: 实现 clipboard API
};

/**
 * NotificationOptions 接口
 */
export interface NotificationOptions {
  /** 通知标题（必填） */
  title: string;
  /** 通知内容 */
  body?: string;
  /** 图标路径 */
  icon?: string;
  /** 是否静音 */
  silent?: boolean;
}

/**
 * 通知相关 API
 */
export const notification = {
  show: (options: NotificationOptions): Promise<void> => {
    return vokexCall('notification.show', [options]);
  },
};

/**
 * 事件监听相关 API
 */
export const events = {
  /**
   * 监听事件
   */
  on: (event: string, listener: (data: any) => void): void => {
    const vokex = (window as any).__VOKEX__;
    if (vokex?.on) {
      vokex.on(event, listener);
    }
  },

  /**
   * 取消监听事件
   */
  off: (event: string, listener: (data: any) => void): void => {
    const vokex = (window as any).__VOKEX__;
    if (vokex?.off) {
      vokex.off(event, listener);
    }
  },

  /**
   * 触发事件（内部使用）
   */
  emit: (event: string, data?: any): void => {
    const vokex = (window as any).__VOKEX__;
    if (vokex?.__emit__) {
      vokex.__emit__(event, data);
    }
  },
};

/**
 * 底层调用（兼容旧版 API）
 */
export const call = (method: string, args: any[] = []): Promise<any> => {
  return vokexCall(method, args);
};
