/**
 * 'a' 框架 - Vite 插件
 *
 * 在 Vite 构建完成后，自动将前端资源嵌入到预编译壳中
 *
 * 用法：
 * ```ts
 * // vite.config.ts
 * import { aPlugin } from "a/vite-plugin";
 *
 * export default defineConfig({
 *   plugins: [
 *     vue(),
 *     aPlugin({
 *       name: "我的应用",
 *       window: { width: 1200, height: 800 },
 *     })
 *   ]
 * });
 * ```
 */

import type { Plugin, ResolvedConfig } from "vite";
import { build, type BuildOptions } from "../build/embed";
import { resolve, dirname } from "path";
import { existsSync } from "fs";

/** Vite 插件配置 */
export interface APluginOptions {
  /** 应用名称 */
  name?: string;
  /** 应用图标路径 */
  icon?: string;
  /** 窗口配置 */
  window?: BuildOptions["window"];
  /** 输出文件名（默认使用应用名） */
  outputName?: string;
  /** 输出目录（默认为 dist-release/） */
  outputDir?: string;
  /** 自定义壳二进制路径（默认使用内置预编译壳） */
  shellPath?: string;
  /** 是否在开发模式下跳过构建 */
  skipInDev?: boolean;
  /** 是否显示详细日志 */
  verbose?: boolean;
  /** 构建完成后是否自动打开应用 */
  openAfterBuild?: boolean;
}

/** 获取预编译壳路径 */
function getPrebuiltShellPath(): string {
  const platform = process.platform;
  const arch = process.arch;

  const platformMap: Record<string, string> = {
    win32: "win32-x64",
    darwin: `darwin-${arch}`,
    linux: `linux-${arch}`,
  };

  const platformKey = platformMap[platform] || `${platform}-${arch}`;

  // 尝试多个可能的路径
  const possiblePaths = [
    // 从 npm 包中查找
    resolve(__dirname, `../prebuilt/${platformKey}/shell${platform === "win32" ? ".exe" : ""}`),
    resolve(__dirname, `../../prebuilt/${platformKey}/shell${platform === "win32" ? ".exe" : ""}`),
    resolve(process.cwd(), `node_modules/a/prebuilt/${platformKey}/shell${platform === "win32" ? ".exe" : ""}`),
    resolve(process.cwd(), `prebuilt/${platformKey}/shell${platform === "win32" ? ".exe" : ""}`),
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) return p;
  }

  throw new Error(
    `找不到预编译壳二进制文件。\n` +
    `已尝试以下路径:\n${possiblePaths.map((p) => `  - ${p}`).join("\n")}\n\n` +
    `请确保已安装对应平台的预编译壳，或使用 shellPath 选项指定路径。`
  );
}

export function aPlugin(options: APluginOptions = {}): Plugin {
  let config: ResolvedConfig;
  let isDev = false;

  return {
    name: "a-plugin",

    config(_, env) {
      isDev = env.command === "serve";
    },

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    closeBundle() {
      // 开发模式下跳过
      if (isDev && options.skipInDev !== false) {
        console.log("[a] 开发模式，跳过原生构建");
        return;
      }

      const distDir = resolve(config.root, config.build.outDir);

      if (!existsSync(distDir)) {
        console.warn(`[a] 构建产物目录不存在: ${distDir}`);
        return;
      }

      try {
        const shellPath = options.shellPath || getPrebuiltShellPath();
        const outputName = options.outputName
          ? (options.outputName + (process.platform === "win32" ? ".exe" : ""))
          : (options.name || "app") + (process.platform === "win32" ? ".exe" : "");
        const outputDir = options.outputDir || resolve(config.root, "release");
        const outputPath = resolve(outputDir, outputName);

        const result = build({
          inputDir: distDir,
          shellPath,
          outputPath,
          name: options.name,
          icon: options.icon,
          window: options.window,
          verbose: options.verbose,
        });

        if (options.openAfterBuild) {
          const { exec } = require("child_process");
          const command = process.platform === "win32"
            ? `start "" "${result.outputPath}"`
            : `open "${result.outputPath}"`;
          exec(command);
        }
      } catch (error: any) {
        console.error(`[a] ❌ 构建失败: ${error.message}`);
        if (options.verbose) {
          console.error(error.stack);
        }
      }
    },
  };
}
