/**
 * zinc 框架 - 友好的 API 封装
 *
 * 提供类似 import { os } from 'zinc' 的调用方式
 */

// 内部调用函数
function zincCall(method: string, args: any[] = []): Promise<any> {
  const zinc = (window as any).__ZINC__;
  if (!zinc?.call) {
    console.warn(`[zinc] 此 API 仅在原生模式下可用`);
    return Promise.resolve(undefined);
  }
  return zinc.call(method, args);
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
 * 应用相关 API
 */
export const app = {
  /**
   * 应用是否已完成初始化
   */
  isReady: (): Promise<boolean> => zincCall('app.isReady'),

  /**
   * 应用名称
   */
  name: (): Promise<string> => zincCall('app.name'),

  /**
   * 应用版本号
   */
  version: (): Promise<string> => zincCall('app.version'),

  /**
   * 应用标识符
   */
  identifier: (): Promise<string> => zincCall('app.identifier'),

  /**
   * 是否以打包模式运行
   */
  isPackaged: (): Promise<boolean> => zincCall('app.isPackaged'),

  /**
   * 是否在原生壳中运行
   */
  isNative: (): Promise<boolean> => zincCall('app.isNative'),
};

/**
 * 操作系统相关 API
 */
export const os = {
  /**
   * 获取操作系统平台
   * @returns 'windows' | 'macos' | 'linux' | etc.
   */
  platform: (): Promise<string> => zincCall('os.platform'),

  /**
   * 获取系统架构
   * @returns 'x86_64' | 'aarch64' | etc.
   */
  arch: (): Promise<string> => zincCall('os.arch'),

  /**
   * 获取用户主目录
   */
  homeDir: (): Promise<string> => zincCall('os.homeDir'),

  /**
   * 获取临时目录
   */
  tempDir: (): Promise<string> => zincCall('os.tempDir'),

  /**
   * 获取主机名
   */
  hostname: (): Promise<string> => zincCall('os.hostname'),
};

/**
 * 进程相关 API
 */
export const process = {
  /**
   * 获取当前进程 ID
   */
  pid: (): Promise<number> => zincCall('process.pid'),

  /**
   * 获取当前工作目录
   */
  cwd: (): Promise<string> => zincCall('process.cwd'),

  /**
   * 获取环境变量
   */
  env: (): Promise<Record<string, string>> => zincCall('process.env'),

  /**
   * 退出应用
   */
  exit: (): Promise<void> => zincCall('process.exit'),
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
    const zinc = (window as any).__ZINC__;
    if (zinc?.on) {
      zinc.on(event, listener);
    }
  },

  /**
   * 取消监听事件
   */
  off: (event: string, listener: (data: any) => void): void => {
    const zinc = (window as any).__ZINC__;
    if (zinc?.off) {
      zinc.off(event, listener);
    }
  },

  /**
   * 触发事件（内部使用）
   */
  emit: (event: string, data?: any): void => {
    const zinc = (window as any).__ZINC__;
    if (zinc?.__emit__) {
      zinc.__emit__(event, data);
    }
  },
};

/**
 * 底层调用（兼容旧版 API）
 */
export const call = (method: string, args: any[] = []): Promise<any> => {
  return zincCall(method, args);
};
