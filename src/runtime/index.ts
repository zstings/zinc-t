/**
 * zinc 框架 - 运行时 API
 *
 * 前端调用原生 API 的接口
 */

interface ZincAPI {
  call: (method: string, args: any[]) => Promise<any>;
  __emit__: (event: string, data?: any) => void;
  on: (event: string, listener: (data: any) => void) => void;
  off: (event: string, listener: (data: any) => void) => void;
}

declare const window: {
  __ZINC__?: ZincAPI;
};

const original = window.__ZINC__;

const zincAPI: ZincAPI = {
  call: original?.call ?? (async () => {
    console.warn(`[zinc] 此 API 仅在原生模式下可用`);
    return undefined;
  }),
  __emit__: original?.__emit__ ?? ((_event: string, _data?: any) => {}),
  on: original?.on ?? ((_event: string, _listener: (data: any) => void) => {}),
  off: original?.off ?? ((_event: string, _listener: (data: any) => void) => {}),
};

window.__ZINC__ = zincAPI;

export {};
