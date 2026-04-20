/**
 * vokex 框架 - 运行时 API
 *
 * 前端调用原生 API 的接口
 */

interface VokexAPI {
  call: (method: string, args: any[]) => Promise<any>;
  __emit__: (event: string, data?: any) => void;
  on: (event: string, listener: (data: any) => void) => void;
  off: (event: string, listener: (data: any) => void) => void;
}

declare const window: {
  __VOKEX__?: VokexAPI;
};

// 如果已经存在 __VOKEX__（壳已注入），则不要覆盖
if (!window.__VOKEX__) {
  const vokexAPI: VokexAPI = {
    call: async () => {
      console.warn(`[vokex] 此 API 仅在原生模式下可用`);
      return undefined;
    },
    __emit__: (_event: string, _data?: any) => {},
    on: (_event: string, _listener: (data: any) => void) => {},
    off: (_event: string, _listener: (data: any) => void) => {},
  };
  window.__VOKEX__ = vokexAPI;
}

export {};
