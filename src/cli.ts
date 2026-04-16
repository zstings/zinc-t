#!/usr/bin/env node

/**
 * zinc 框架 - CLI 工具
 *
 * 用法：
 *   zinc build [options]     构建原生可执行文件
 *   zinc validate <file>     验证二进制文件
 *   zinc dev                 开发模式（启动 Vite + 壳加载开发服务器）
 */

import { resolve } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { spawn, ChildProcess } from "child_process";
import { build, validate } from "./build/embed.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function dirname(path: string): string {
  return resolve(path, "..");
}

// ============================================================
// CLI 参数解析
// ============================================================

function parseArgs(args: string[]): Record<string, any> {
  const result: Record<string, any> = { _: [] };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        result[key] = next;
        i++;
      } else {
        result[key] = true;
      }
    } else {
      result._.push(arg);
    }
  }

  return result;
}

// ============================================================
// Vite 开发服务器管理
// ============================================================

function parseVitePort(output: string): number | null {
  // Vite 输出格式: "  ➜  Local:   http://localhost:5173/"
  const localMatch = output.match(/localhost:(\d+)/);
  if (localMatch) {
    return parseInt(localMatch[1]);
  }

  // 备用匹配: "Local: http://127.0.0.1:5173/"
  const ipMatch = output.match(/127\.0\.0\.1:(\d+)/);
  if (ipMatch) {
    return parseInt(ipMatch[1]);
  }

  return null;
}

function isViteReady(output: string): boolean {
  // Vite 输出格式: "VITE v8.0.8  ready in 264 ms"
  return output.includes("ready in") || output.includes(" ready in ") || output.includes("ready,");
}

async function startViteDevServer(rootDir: string): Promise<{ port: number; child: ChildProcess }> {
  return new Promise((resolve, reject) => {
    console.log("[zinc] 启动 Vite 开发服务器...");

    const vite = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["vite", "--port", "0"],
      {
        cwd: rootDir,
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
      }
    );

    let outputBuffer = "";
    let port: number | null = null;
    let resolved = false;

    vite.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      outputBuffer += text;
      process.stdout.write(text);

      // 尝试解析端口
      if (!port) {
        port = parseVitePort(outputBuffer);
      }

      // 检查是否完全启动
      if (port && isViteReady(outputBuffer) && !resolved) {
        resolved = true;
        console.log(`[zinc] Vite 开发服务器已启动: http://localhost:${port}`);
        resolve({ port, child: vite });
      }
    });

    vite.stderr?.on("data", (data: Buffer) => {
      process.stderr.write(data);
    });

    vite.on("error", (error) => {
      reject(error);
    });

    // 超时处理：5秒内没有获取到端口则使用默认
    setTimeout(() => {
      if (!resolved) {
        const detectedPort = parseVitePort(outputBuffer);
        if (detectedPort) {
          port = detectedPort;
          resolve({ port: detectedPort, child: vite });
        } else {
          // 使用 Vite 默认端口
          console.log("[zinc] 无法自动检测端口，使用默认端口 5173");
          resolve({ port: 5173, child: vite });
        }
      }
    }, 5000);
  });
}

// ============================================================
// 命令实现
// ============================================================

function cmdBuild(args: Record<string, any>) {
  const inputDir = resolve(args.input || args.i || "dist");
  const shellPath = resolve(args.shell || args.s || getDefaultShellPath());
  const outputName = args.name || args.n || "app";
  const outputDir = resolve(args.output || args.o || "release");
  const outputPath = resolve(outputDir, outputName + (process.platform === "win32" ? ".exe" : ""));

  // 窗口配置
  const windowConfig: any = {};
  if (args.title) windowConfig.title = args.title;
  if (args.width) windowConfig.width = parseInt(args.width);
  if (args.height) windowConfig.height = parseInt(args.height);
  if (args["min-width"]) windowConfig.min_width = parseInt(args["min-width"]);
  if (args["min-height"]) windowConfig.min_height = parseInt(args["min-height"]);
  if (args.resizable === "false") windowConfig.resizable = false;
  if (args.fullscreen === "true") windowConfig.fullscreen = true;
  if (args.maximized === "true") windowConfig.maximized = true;
  if (args.transparent === "true") windowConfig.transparent = true;
  if (args["no-decoration"] === "true") windowConfig.decorations = false;
  if (args["always-on-top"] === "true") windowConfig.always_on_top = true;

  try {
    build({
      inputDir,
      shellPath,
      outputPath,
      name: args.name || undefined,
      icon: args.icon || undefined,
      window: Object.keys(windowConfig).length > 0 ? windowConfig : undefined,
      verbose: args.verbose === "true" || args.v === true,
    });
  } catch (error: any) {
    console.error(`[zinc] ❌ 构建失败: ${error.message}`);
    process.exit(1);
  }
}

function cmdValidate(args: Record<string, any>) {
  const filePath = resolve(args._[0] || "");
  if (!existsSync(filePath)) {
    console.error(`[zinc] 文件不存在: ${filePath}`);
    process.exit(1);
  }

  const result = validate(filePath);
  if (result.valid && result.info) {
    console.log(`[zinc] ✅ 有效的 'zinc' 应用`);
    console.log(`[zinc]    嵌入文件数: ${result.info.fileCount}`);
    console.log(`[zinc]    资源大小: ${(result.info.originalSize / 1024).toFixed(1)} KB`);
  } else {
    console.log(`[zinc] ❌ 不是有效的 'zinc' 应用`);
    process.exit(1);
  }
}

async function cmdDev(args: Record<string, any>) {
  const shellPath = resolve(args.shell || args.s || getDefaultShellPath());
  // devDir 是项目根目录，Vite 会在该目录下运行
  const devDir = resolve(args.dir || ".");

  if (!existsSync(shellPath)) {
    console.error(`[zinc] 壳文件不存在: ${shellPath}`);
    console.error(`[zinc] 请先编译壳: cd shell && cargo build --release`);
    process.exit(1);
  }

  if (!existsSync(devDir)) {
    console.error(`[zinc] 项目目录不存在: ${devDir}`);
    process.exit(1);
  }

  try {
    // 启动 Vite 开发服务器
    const { port, child: viteChild } = await startViteDevServer(devDir);

    // 启动壳，加载 Vite 开发服务器
    const devUrl = `http://localhost:${port}`;
    console.log(`[zinc] 启动壳，加载: ${devUrl}`);

    const shellChild = spawn(shellPath, ["--dev-url", devUrl], {
      stdio: "inherit",
      shell: true,
    });

    // 处理关闭
    const cleanup = () => {
      console.log("[zinc] 关闭 Vite 开发服务器...");
      viteChild.kill();
      shellChild.kill();
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    shellChild.on("close", (code: number) => {
      cleanup();
      process.exit(code);
    });

    viteChild.on("close", (code: number) => {
      shellChild.kill();
      process.exit(code);
    });
  } catch (error: any) {
    console.error(`[zinc] ❌ 开发模式启动失败: ${error.message}`);
    process.exit(1);
  }
}

function getDefaultShellPath(): string {
  const platform = process.platform;
  const arch = process.arch;
  const ext = platform === "win32" ? ".exe" : "";
  const platformKey = `${platform}-${arch}`;

  const possiblePaths = [
    resolve(__dirname, `../prebuilt/${platformKey}/shell${ext}`),
    resolve(process.cwd(), `prebuilt/${platformKey}/shell${ext}`),
    resolve(process.cwd(), `shell/target/release/shell${ext}`),
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) return p;
  }

  return resolve(process.cwd(), `prebuilt/${platformKey}/shell${ext}`);
}

// ============================================================
// 主入口
// ============================================================

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  switch (command) {
    case "build":
      cmdBuild(args);
      break;
    case "validate":
      cmdValidate(args);
      break;
    case "dev":
      cmdDev(args);
      break;
    default:
      console.log(`
'zinc' - 超轻量级桌面应用构建库

用法:
  zinc build [options]     将前端构建产物打包为原生可执行文件
  zinc validate <file>     验证二进制文件是否为有效的 'zinc' 应用
  zinc dev [options]       开发模式（启动 Vite + 壳加载开发服务器）

build 选项:
  -i, --input <dir>       前端构建产物目录 (默认: dist)
  -s, --shell <path>      壳二进制路径 (默认: 自动检测)
  -o, --output <dir>      输出目录 (默认: release)
  -n, --name <name>       应用名称 (默认: app)
  --title <title>         窗口标题
  --width <px>            窗口宽度 (默认: 1200)
  --height <px>           窗口高度 (默认: 800)
  --min-width <px>        最小宽度
  --min-height <px>       最小高度
  --resizable <bool>      是否可缩放 (默认: true)
  --fullscreen <bool>     是否全屏 (默认: false)
  --transparent <bool>    是否透明 (默认: false)
  --no-decoration <bool>  是否无边框 (默认: false)
  --always-on-top <bool>  是否置顶 (默认: false)
  -v, --verbose           显示详细日志

dev 选项:
  -s, --shell <path>      壳二进制路径
  --dir <dir>             项目目录 (默认: .)

示例:
  zinc build -i dist -n "我的应用" --width 1200 --height 800
  zinc dev --dir .
  zinc validate release/my-app.exe
`);
      break;
  }
}

main();
