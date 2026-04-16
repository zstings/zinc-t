/**
 * 'a' 框架 - 主入口
 *
 * 使用方式：
 * ```ts
 * import { window, fs, os, events, isNative } from "a";
 * ```
 */

export { isNative, window, fs, app, dialog, clipboard, os, process, events } from "./runtime/index.js";
export { default } from "./runtime/index.js";
