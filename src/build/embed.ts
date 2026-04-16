/**
 * 'a' 框架 - 资源嵌入构建器
 *
 * 将前端构建产物嵌入到预编译的壳二进制文件中
 *
 * 嵌入格式（二进制尾部追加）：
 * [RESOURCE_MAGIC(4字节)] [索引长度(4字节)] [索引JSON] [zlib压缩数据] [资源偏移量(8字节)]
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, relative, sep, dirname } from "path";
import { deflateSync } from "zlib";

// 资源魔数 "ARES" = A Resource Embedded Shell
const RESOURCE_MAGIC = Buffer.from([0x41, 0x52, 0x45, 0x53]);

/** 资源索引：文件名 -> [偏移量, 长度] */
export type ResourceIndex = Record<string, [number, number]>;

/** 构建配置 */
export interface BuildOptions {
  /** 前端构建产物目录（如 vite 的 dist/） */
  inputDir: string;
  /** 预编译壳二进制路径 */
  shellPath: string;
  /** 输出文件路径 */
  outputPath: string;
  /** 应用名称 */
  name?: string;
  /** 应用图标路径 */
  icon?: string;
  /** 窗口配置 */
  window?: {
    title?: string;
    width?: number;
    height?: number;
    min_width?: number;
    min_height?: number;
    resizable?: boolean;
    fullscreen?: boolean;
    maximized?: boolean;
    transparent?: boolean;
    decorations?: boolean;
    always_on_top?: boolean;
    center?: boolean;
  };
  /** 是否显示详细日志 */
  verbose?: boolean;
}

/** 构建结果 */
export interface BuildResult {
  /** 输出文件路径 */
  outputPath: string;
  /** 嵌入的文件数量 */
  fileCount: number;
  /** 原始资源大小 */
  originalSize: number;
  /** 压缩后大小 */
  compressedSize: number;
  /** 最终二进制大小 */
  finalSize: number;
  /** 压缩率 */
  compressionRatio: number;
}

/**
 * 扫描目录，收集所有文件
 */
function scanDir(dir: string, base: string): { files: Map<string, Buffer>; totalSize: number } {
  const files = new Map<string, Buffer>();
  let totalSize = 0;

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const relativePath = relative(base, fullPath).replace(/\\/g, "/");
        const content = readFileSync(fullPath);
        files.set(relativePath, content);
        totalSize += content.length;
      }
    }
  }

  walk(dir);
  return { files, totalSize };
}

/**
 * 生成 a.config.json（嵌入到资源中，供壳读取）
 */
function generateAppConfig(options: BuildOptions): string {
  const config: Record<string, unknown> = {};

  if (options.name) config.name = options.name;
  if (options.window) {
    config.window = options.window;
  }

  return JSON.stringify(config, null, 2);
}

/**
 * 执行构建
 */
export function build(options: BuildOptions): BuildResult {
  const { inputDir, shellPath, outputPath, verbose = false } = options;

  // 1. 读取壳二进制
  if (verbose) console.log(`[a] 读取壳二进制: ${shellPath}`);
  const shellBinary = readFileSync(shellPath);

  // 2. 扫描前端资源
  if (verbose) console.log(`[a] 扫描资源目录: ${inputDir}`);
  const { files, totalSize: originalSize } = scanDir(inputDir, inputDir);

  if (files.size === 0) {
    throw new Error(`资源目录为空: ${inputDir}`);
  }

  if (verbose) console.log(`[a] 找到 ${files.size} 个文件，总大小 ${(originalSize / 1024).toFixed(1)} KB`);

  // 3. 生成应用配置并加入资源
  const appConfig = generateAppConfig(options);
  files.set("a.config.json", Buffer.from(appConfig, "utf-8"));

  // 4. 构建资源索引和拼接数据
  const index: ResourceIndex = {};
  const buffers: Buffer[] = [];
  let offset = 0;

  // 按文件名排序，确保确定性
  const sortedFiles = Array.from(files.entries()).sort(([a], [b]) => a.localeCompare(b));

  for (const [name, content] of sortedFiles) {
    index[name] = [offset, content.length];
    buffers.push(content);
    offset += content.length;
  }

  const rawData = Buffer.concat(buffers);

  // 5. zlib 压缩
  if (verbose) console.log(`[a] 压缩资源...`);
  const compressedData = deflateSync(rawData, { level: 9 });

  if (verbose) {
    console.log(`[a] 原始: ${(rawData.length / 1024).toFixed(1)} KB`);
    console.log(`[a] 压缩后: ${(compressedData.length / 1024).toFixed(1)} KB`);
    console.log(`[a] 压缩率: ${((1 - compressedData.length / rawData.length) * 100).toFixed(1)}%`);
  }

  // 6. 序列化索引
  const indexJson = JSON.stringify(index);
  const indexBuffer = Buffer.from(indexJson, "utf-8");
  const indexLenBuffer = Buffer.alloc(4);
  indexLenBuffer.writeUInt32LE(indexBuffer.length);

  // 7. 构建资源尾部
  // 格式: [MAGIC(4)] [索引长度(4)] [索引JSON] [压缩数据] [偏移量(8)]
  const resourceOffset = shellBinary.length;
  const offsetBuffer = Buffer.alloc(8);
  offsetBuffer.writeBigUInt64LE(BigInt(resourceOffset));

  const resourceTail = Buffer.concat([
    RESOURCE_MAGIC,     // 4 字节魔数
    indexLenBuffer,     // 4 字节索引长度
    indexBuffer,        // 索引 JSON
    compressedData,     // zlib 压缩的资源数据
    offsetBuffer,       // 8 字节偏移量（指向 MAGIC 的位置）
  ]);

  // 8. 合并壳 + 资源
  const finalBinary = Buffer.concat([shellBinary, resourceTail]);

  // 9. 确保输出目录存在
  const outputDir = dirname(outputPath);
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch {
    // 目录可能已存在
  }

  // 10. 写入最终文件
  writeFileSync(outputPath, finalBinary);

  const result: BuildResult = {
    outputPath,
    fileCount: files.size,
    originalSize,
    compressedSize: compressedData.length,
    finalSize: finalBinary.length,
    compressionRatio: 1 - compressedData.length / rawData.length,
  };

  console.log(`[a] ✅ 构建成功!`);
  console.log(`[a]    文件数: ${result.fileCount}`);
  console.log(`[a]    资源: ${(result.originalSize / 1024).toFixed(1)} KB → ${(result.compressedSize / 1024).toFixed(1)} KB (${(result.compressionRatio * 100).toFixed(0)}% 压缩)`);
  console.log(`[a]    输出: ${result.outputPath} (${(result.finalSize / 1024 / 1024).toFixed(2)} MB)`);

  return result;
}

/**
 * 验证二进制文件是否包含嵌入资源
 */
export function validate(binaryPath: string): { valid: boolean; info?: { fileCount: number; originalSize: number } } {
  try {
    const data = readFileSync(binaryPath);

    if (data.length < 8) return { valid: false };

    // 读取尾部 8 字节偏移量
    const offset = Number(data.readBigUInt64LE(data.length - 8));

    // 验证魔数
    if (data.length < offset + 4) return { valid: false };
    const magic = data.subarray(offset, offset + 4);
    if (!magic.equals(RESOURCE_MAGIC)) return { valid: false };

    // 读取索引
    const indexLen = data.readUInt32LE(offset + 4);
    const indexJson = data.subarray(offset + 8, offset + 8 + indexLen).toString("utf-8");
    const index: ResourceIndex = JSON.parse(indexJson);

    return {
      valid: true,
      info: {
        fileCount: Object.keys(index).length,
        originalSize: Object.values(index).reduce((sum, [, len]) => sum + len, 0),
      },
    };
  } catch {
    return { valid: false };
  }
}
