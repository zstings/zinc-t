#!/usr/bin/env node

/**
 * zinc 框架 - CLI 工具
 *
 * 用法：
 *   zinc validate <file>     验证二进制文件是否为有效的 'zinc' 应用
 *
 * 注意：构建和开发功能已迁移到 Vite 插件
 *   - 开发模式: 使用 `vite` 命令，插件会自动启动壳
 *   - 构建模式: 使用 `vite build` 命令，插件会自动嵌入资源
 */

import { resolve } from "path";
import { existsSync } from "fs";
import { validate } from "./build/embed.js";

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
// 命令实现
// ============================================================

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

// ============================================================
// 主入口
// ============================================================

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  switch (command) {
    case "validate":
      cmdValidate(args);
      break;
    case "build":
    case "dev":
      console.log(`[zinc] "${command}" 命令已迁移到 Vite 插件`);
      console.log(`[zinc] 请使用以下方式：`);
      console.log(`  - 开发模式: vite`);
      console.log(`  - 构建模式: vite build`);
      console.log(`[zinc] 确保 vite.config.ts 中已配置 zincPlugin()`);
      process.exit(1);
      break;
    default:
      console.log(`
'zinc' - 超轻量级桌面应用构建库

用法:
  zinc validate <file>     验证二进制文件是否为有效的 'zinc' 应用

构建和开发功能已迁移到 Vite 插件：
  // vite.config.ts
  import { zincPlugin } from "zinc/vite-plugin";
  
  export default defineConfig({
    plugins: [
      zincPlugin({
        name: "我的应用",
        identifier: "com.example.myapp",
        version: "1.0.0",
        window: {
          title: "我的应用",
          width: 1200,
          height: 800,
        },
      })
    ]
  });

然后使用：
  vite          # 开发模式（自动启动壳）
  vite build    # 构建模式（自动嵌入资源）

示例:
  zinc validate release/my-app.exe
`);
      break;
  }
}

main().catch((err) => {
  console.error(`[zinc] ❌ ${err.message}`);
  process.exit(1);
});
