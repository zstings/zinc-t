/**
 * vokex 框架 - 运行时 API 入口（浏览器环境）
 */

// 运行时 API
export { app, process, fs, shell, dialog, clipboard, notification, events, call, computer, http, storage } from "./runtime/api";
export type { NotificationOptions, DirEntry, FileInfo, FsAPI, CpuUsage, MemoryInfo, ProcessAPI, ExecOptions, ShellResult, ShellAPI, CpuInfo, MemoryInfo as ComputerMemoryInfo, OsInfo, Display, ComputerAPI, RequestOptions, HttpResponse, HttpAPI, StorageAPI } from "./runtime/api";
