/**
 * vokex 框架 - Vite 插件
 *
 * 在 Vite 构建完成后，自动将前端资源嵌入到预编译壳中
 *
 * 用法：
 * ```ts
 * // vite.config.ts
 * import { vokexPlugin } from "vokex/vite-plugin";
 *
 * export default defineConfig({
 *   plugins: [
 *     vue(),
 *     vokexPlugin({
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
import { spawn, type ChildProcess } from "child_process";

/** 获取当前文件的目录 */
function getCurrentDir(): string {
  return dirname(fileURLToPath(import.meta.url));
}

/** Vite 插件配置 */
export interface VokexPluginOptions {
  /** 应用名称 */
  name: string;
  /** 应用标识符，用于存储用户数据目录 (e.g. com.example.myapp) */
  identifier?: string;
  /** 应用图标路径 */
  icon?: string;
  /** 窗口配置 */
  window?: {
    title?: string;
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    resizable?: boolean;
    fullscreen?: boolean;
    maximized?: boolean;
    transparent?: boolean;
    decorations?: boolean;
    alwaysOnTop?: boolean;
    center?: boolean;
  };
  /** 应用版本号 */
  version?: string;
  /** 输出路径（完整路径，默认为 release/应用名.exe） */
  outputDir?: string;
  /** 自定义壳二进制路径（默认使用内置预编译壳） */
  shellPath?: string;
  /** 是否在开发模式下跳过构建 */
  skipInDev?: boolean;
  /** 是否显示详细日志 */
  verbose?: boolean;
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
    resolve(process.cwd(), `node_modules/vokex/prebuilt/${platformKey}/shell${platform === "win32" ? ".exe" : ""}`),
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

/** 开发模式数据文件路径 */
const DEV_DATA_FILE = ".vokex-cli-data.json";

export function vokexPlugin(options: VokexPluginOptions): Plugin {
  let config: ResolvedConfig;
  let isDev = false;
  let shellChild: ChildProcess | null = null;

  // 获取壳路径
  const getShellPath = () => options.shellPath || getPrebuiltShellPath();

  // 获取输出路径
  const getOutputPath = () => {
    if (options.outputDir) {
      return resolve(options.outputDir);
    }
    const outputName = options.name + (process.platform === "win32" ? ".exe" : "");
    return resolve(process.cwd(), "release", outputName);
  };

  // 获取输入目录
  const getInputDir = () => resolve(process.cwd(), config?.build?.outDir || "dist");

  // 启动壳（开发模式）
  function startShell(devUrl: string) {
    const shellPath = getShellPath();

    if (!existsSync(shellPath)) {
      console.error(`[vokex] 壳文件不存在: ${shellPath}`);
      console.error(`[vokex] 请先编译壳: cd shell && cargo build --release`);
      return;
    }

    console.log(`[vokex] 启动壳，加载: ${devUrl}`);

    // 构建配置，添加 dev_mode: true
    const devConfig = {
      ...options,
      dev_mode: true,
    };

    const shellArgs = ["--dev-url", devUrl, "--app-config", JSON.stringify(devConfig)];
    console.log(`[vokex] 壳参数: ${shellArgs.join(" ")}`);
    
    const shell = spawn(shellPath, shellArgs, { 
      stdio: ["ignore", "pipe", "pipe"],
      detached: true 
    });
    shellChild = shell;
    shell.unref();

    // 捕获输出
    shell.stdout?.on("data", (data) => {
      console.log(`[shell] ${data.toString().trim()}`);
    });
    shell.stderr?.on("data", (data) => {
      console.error(`[shell] ${data.toString().trim()}`);
    });

    // 壳关闭时退出进程
    shell.on("close", (code) => {
      console.log(`[vokex] 壳已退出，退出码: ${code}`);
      process.exit(code || 0);
    });

    // 壳启动错误
    shell.on("error", (err) => {
      console.error(`[vokex] 壳启动失败: ${err.message}`);
    });

    // Ctrl+C 时杀壳
    process.on("SIGINT", () => {
      if (shellChild && !shellChild.killed) {
        shellChild.kill();
      }
      process.exit(0);
    });
  }

  // 执行构建
  async function doBuild() {
    const inputDir = getInputDir();
    const shellPath = getShellPath();
    const outputPath = getOutputPath();

    if (!existsSync(inputDir)) {
      console.warn(`[vokex] 构建产物目录不存在: ${inputDir}`);
      return;
    }

    try {
      const { build } = await loadEmbedModule();
      const result = await build({
        inputDir,
        shellPath,
        outputPath,
        verbose: options.verbose,
      });

      console.log(`[vokex:build] OUTPUT_DIR=${result.outputPath}`);
    } catch (error: any) {
      console.error(`[vokex] ❌ 构建失败: ${error.message}`);
      if (options.verbose) {
        console.error(error.stack);
      }
      throw error;
    }
  }

  return {
    name: "vokex-plugin",

    config(_, env) {
      isDev = env.command === "serve";
    },

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    configureServer(server) {
      if (!isDev) return;
      // 开发模式下，Vite 服务器启动后启动壳
      server.httpServer?.once("listening", () => {
        const address = server.httpServer?.address();
        if (address && typeof address === "object" && "port" in address) {
          const port = address.port;
          const devUrl = `http://localhost:${port}`;
          console.log(`[vokex] Vite 开发服务器已启动: ${devUrl}`);
          // 启动壳
          startShell(devUrl);
        }
      });
    },

    async closeBundle() {
      // 开发模式下跳过
      if (isDev && options.skipInDev !== false) {
        console.log("[vokex] 开发模式，跳过原生构建");
        return;
      }
      // 构建配置，添加 dev_mode: false
      const buildConfig = {
        ...options,
        dev_mode: false,
      };
      writeFileSync(resolve(process.cwd(), config?.build?.outDir || "dist", DEV_DATA_FILE), JSON.stringify(buildConfig), "utf-8");
      // 执行构建
      await doBuild();
    },
  };
}

// 默认导出
export default vokexPlugin;
