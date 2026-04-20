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
 * 文件系统相关 API
 */
export const fs = {
  // TODO: 实现 fs API
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
  /** 设置应用名称 */
  setName: (name: string) => Promise<void>;
  /** 获取系统语言标识，如 zh-CN、en-US */
  getLocale: () => Promise<string>;
  /** 设置 macOS Dock 图标徽标 */
  setDockBadge: (text: string) => Promise<void>;
  /** 请求单实例锁，防止重复启动 */
  requestSingleInstanceLock: () => Promise<boolean>;
  /** 检查是否持有单实例锁 */
  hasSingleInstanceLock: () => Promise<boolean>;
  /** 设置应用代理 */
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
   * 检查是否持有单实例锁
   */
  hasSingleInstanceLock: (): Promise<boolean> => vokexCall('app.hasSingleInstanceLock'),

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
 * 进程相关 API
 */
export const process = {
  /**
   * 获取当前进程 ID
   */
  pid: (): Promise<number> => vokexCall('process.pid'),

  /**
   * 获取当前工作目录
   */
  cwd: (): Promise<string> => vokexCall('process.cwd'),

  /**
   * 获取环境变量
   */
  env: (): Promise<Record<string, string>> => vokexCall('process.env'),

  /**
   * 退出应用
   */
  exit: (): Promise<void> => vokexCall('process.exit'),
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
