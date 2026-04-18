/**
 * zinc 框架 - Vite 插件
 *
 * 在 Vite 构建完成后，自动将前端资源嵌入到预编译壳中
 *
 * 用法：
 * ```ts
 * // vite.config.ts
 * import { zincPlugin } from "zinc/vite-plugin";
 *
 * export default defineConfig({
 *   plugins: [
 *     vue(),
 *     zincPlugin({
 *       name: "我的应用",
 *       window: { width: 1200, height: 800 },
 *     })
 *   ]
 * });
 * ```
 */

import type { Plugin, ResolvedConfig } from "vite";
import { resolve, dirname } from "path";
import { existsSync, writeFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";

/** 获取当前文件的目录 */
function getCurrentDir(): string {
  return dirname(fileURLToPath(import.meta.url));
}

/** Vite 插件配置 */
export interface ZincPluginOptions {
  /** 应用名称 */
  name?: string;
  /** 应用标识符，用于存储用户数据目录 (e.g. com.example.myapp) */
  identifier?: string;
  /** 应用图标路径 */
  icon?: string;
  /** 窗口配置 */
  window?: any;
  /** 应用版本号 */
  version?: string;
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
  const currentDir = getCurrentDir();

  const platformMap: Record<string, string> = {
    win32: "win32-x64",
    darwin: `darwin-${arch}`,
    linux: `linux-${arch}`,
  };

  const platformKey = platformMap[platform] || `${platform}-${arch}`;

  // 尝试多个可能的路径
  const possiblePaths = [
    resolve(currentDir, `../prebuilt/${platformKey}/shell${platform === "win32" ? ".exe" : ""}`),
    resolve(currentDir, `../../prebuilt/${platformKey}/shell${platform === "win32" ? ".exe" : ""}`),
    resolve(process.cwd(), `node_modules/zinc/prebuilt/${platformKey}/shell${platform === "win32" ? ".exe" : ""}`),
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

/** 动态加载 embed 模块 */
async function loadEmbedModule() {
  const require = createRequire(import.meta.url);
  const currentDir = getCurrentDir();
  const embedPath = resolve(currentDir, "../build/embed.js");
  if (existsSync(embedPath)) {
    return require(embedPath);
  }
  // 备用路径
  const fallbackPath = resolve(currentDir, "../../dist/build/embed.js");
  if (existsSync(fallbackPath)) {
    return require(fallbackPath);
  }
  throw new Error(`找不到 embed 模块: ${embedPath}`);
}

export function zincPlugin(options: ZincPluginOptions = {}): Plugin {
  let config: ResolvedConfig;
  let isDev = false;

  return {
    name: "zinc-plugin",

    config(_, env) {
      isDev = env.command === "serve";
    },

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    configureServer(server) {
      if (isDev) {
        server.httpServer?.once('listening', () => {
          const address = server.httpServer?.address();
          if (address && typeof address === 'object' && 'port' in address) {
            const port = address.port;
            writeFileSync(resolve(process.cwd(), ".zinc-cli-data.json"), JSON.stringify({...options, port}), "utf-8");
            console.log(`[zinc:dev] SERVER_OR`);
          }
        });
      }
    },

    async closeBundle() {
      // 开发模式下跳过
      if (isDev && options.skipInDev !== false) {
        console.log("[zinc] 开发模式，跳过原生构建");
        return;
      }

      const distDir = resolve(config.root, config.build.outDir);

      if (!existsSync(distDir)) {
        console.warn(`[zinc] 构建产物目录不存在: ${distDir}`);
        return;
      }

      try {
        const shellPath = options.shellPath || getPrebuiltShellPath();
        const outputName = options.outputName
          ? (options.outputName + (process.platform === "win32" ? ".exe" : ""))
          : (options.name || "app") + (process.platform === "win32" ? ".exe" : "");
        const outputDir = options.outputDir || resolve(config.root, "release");
        const outputPath = resolve(outputDir, outputName);

        const { build } = await loadEmbedModule();
        const result = build({
          inputDir: distDir,
          shellPath,
          outputPath,
          name: options.name,
          identifier: options.identifier,
          icon: options.icon,
          window: options.window,
          verbose: options.verbose,
        });

        console.log(`[zinc:build] OUTPUT_DIR=${result.outputPath}`);

        if (options.openAfterBuild) {
          const { exec } = require("child_process");
          const command = process.platform === "win32"
            ? `start "" "${result.outputPath}"`
            : `open "${result.outputPath}"`;
          exec(command);
        }
      } catch (error: any) {
        console.error(`[zinc] ❌ 构建失败: ${error.message}`);
        if (options.verbose) {
          console.error(error.stack);
        }
      }
    },
  };
}
