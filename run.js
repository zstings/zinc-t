#!/usr/bin/env node

/**
 * Vokex 开发构建脚本
 *
 * 用法:
 *   node run.js dev    # 开发模式：启动文件监听
 *   node run.js build  # 构建模式：一次性构建
 */

import { watch } from "fs";
import { spawn } from "child_process";

// 配置
const DEV_CONFIG = [
  {
    name: "Rust Shell",
    path: "./shell/src",
    debounce: 1000,
    build: buildShellDev,
  },
  {
    name: "TypeScript Source",
    path: "./src",
    debounce: 500,
    build: buildTypeScript,
  },
];

/**
 * 执行命令（返回 Promise）
 */
function execCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令退出码: ${code}`));
      }
    });

    child.on("error", reject);
  });
}

/**
 * 开发模式：构建 Rust Shell
 */
async function buildShellDev() {
  console.log("🔨 [Shell] 开始构建 (debug)...");
  await execCommand("cargo", ["build", "--manifest-path=shell/Cargo.toml"]);
  await execCommand("powershell", [
    '-Command "New-Item -ItemType Directory -Path \'prebuilt/win32-x64\' -Force"',
  ]);
  await execCommand("powershell", [
    '-Command "Copy-Item \'shell/target/debug/vokex-shell.exe\' \'prebuilt/win32-x64/shell.exe\' -Force"',
  ]);
  console.log("✅ [Shell] 构建完成");
}

/**
 * 构建模式：构建 Rust Shell (release)
 */
async function buildShellRelease() {
  console.log("🔨 [Shell] 开始构建 (release)...");
  await execCommand("cargo", ["build", "--release", "--manifest-path=shell/Cargo.toml"]);
  await execCommand("powershell", [
    '-Command "New-Item -ItemType Directory -Path \'prebuilt/win32-x64\' -Force"',
  ]);
  await execCommand("powershell", [
    '-Command "Copy-Item \'shell/target/release/vokex-shell.exe\' \'prebuilt/win32-x64/shell.exe\' -Force"',
  ]);
  console.log("✅ [Shell] 构建完成");
}

/**
 * 构建 TypeScript
 */
async function buildTypeScript() {
  console.log("🔨 [TypeScript] 开始构建...");
  await execCommand("npm", ["run", "build"]);
  console.log("✅ [TypeScript] 构建完成");
}

/**
 * 创建监视器（开发模式）
 */
function createWatcher(config) {
  const { name, path: watchPath, debounce, build } = config;

  let debounceTimer = null;
  let isBuilding = false;

  try {
    const watcher = watch(watchPath, { recursive: true }, (eventType, filename) => {
      // 忽略临时文件和隐藏文件
      if (!filename || filename.startsWith(".") || filename.endsWith("~")) {
        return;
      }

      console.log(`[${new Date().toLocaleTimeString()}] 📁 ${name}: ${eventType} - ${filename}`);

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (isBuilding) {
          console.log(`[${new Date().toLocaleTimeString()}] ⏳ ${name} 正在构建中，跳过...`);
          return;
        }

        isBuilding = true;
        const startTime = Date.now();

        try {
          await build();
          console.log(`[${new Date().toLocaleTimeString()}] ✅ ${name} 构建成功 (${Date.now() - startTime}ms)`);
        } catch (error) {
          console.log(`[${new Date().toLocaleTimeString()}] ❌ ${name} 构建失败: ${error.message}`);
        } finally {
          isBuilding = false;
        }
      }, debounce);
    });

    console.log(`👀 正在监视: ${watchPath}`);

    watcher.on("error", (error) => {
      console.error(`[${name}] 监视错误:`, error);
    });

    return watcher;
  } catch (error) {
    console.error(`[${name}] 创建监视器失败:`, error.message);
    return null;
  }
}

/**
 * 开发模式
 */
function devMode() {
  console.log("🚀 Vokex 开发模式启动\n");
  console.log("按 Ctrl+C 停止监视\n");

  const watchers = new Map();

  for (const config of DEV_CONFIG) {
    const watcher = createWatcher(config);
    if (watcher) {
      watchers.set(config.name, watcher);
    }
  }

  if (watchers.size === 0) {
    console.error("❌ 没有成功创建任何监视器");
    process.exit(1);
  }

  console.log(`\n✅ 已启动 ${watchers.size} 个监视器\n`);

  process.on("SIGINT", () => {
    console.log("\n\n🛑 正在停止监视器...");
    for (const [name, watcher] of watchers) {
      watcher.close();
      console.log(`  已停止: ${name}`);
    }
    console.log("👋 再见!");
    process.exit(0);
  });
}

/**
 * 构建模式
 */
async function buildMode() {
  console.log("🔨 Vokex 构建模式\n");

  const startTime = Date.now();

  try {
    await buildShellRelease();
    await buildTypeScript();
    console.log(`\n✅ 全部构建完成 (${Date.now() - startTime}ms)`);
  } catch (error) {
    console.error(`\n❌ 构建失败: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 主函数
 */
function main() {
  const command = process.argv[2];

  switch (command) {
    case "dev":
      devMode();
      break;
    case "build":
      buildMode();
      break;
    default:
      console.log(`
用法:
  node run.js dev    # 开发模式：启动文件监听
  node run.js build  # 构建模式：一次性构建

示例:
  node run.js dev    # 监听 shell/src/ 和 src/ 变化自动构建
  node run.js build  # 完整构建 release 版本
`);
      process.exit(1);
  }
}

main();
