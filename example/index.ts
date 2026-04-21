import { app, notification, fs } from "vokex";

const output = document.getElementById("output") as HTMLDivElement;

function log(message: string): void {
  output.textContent += message + "\n";
  output.scrollTop = output.scrollHeight;
}

function clear(): void {
  output.textContent = "";
}

// 监听 app.ready 事件
app.on("ready", () => {
  log("📢 事件: app.ready - 应用已就绪");
});

// 监听 app.before-quit 事件
app.on("before-quit", () => {
  log("📢 事件: app.before-quit - 应用即将退出");
});

// 1. 获取应用信息
document.getElementById("btn-app-info")?.addEventListener("click", async () => {
  clear();
  log("=== 应用信息 ===");
  try {
    const name = await app.getName();
    const version = await app.getVersion();
    log(`应用名称: ${name}`);
    log(`应用版本: ${version}`);
  } catch (error: any) {
    log(`错误: ${error.message}`);
  }
});

// 2. 获取应用路径
document.getElementById("btn-app-paths")?.addEventListener("click", async () => {
  clear();
  log("=== 应用路径 ===");
  try {
    const appPath = await app.getAppPath();
    log(`应用路径: ${appPath}`);
  } catch (error: any) {
    log(`错误: ${error.message}`);
  }
});

// 3. 获取系统路径
document
  .getElementById("btn-system-paths")
  ?.addEventListener("click", async () => {
    clear();
    log("=== 系统路径 ===");
    try {
      const paths = [
        "home",
        "appData",
        "desktop",
        "documents",
        "downloads",
        "temp",
      ];
      for (const name of paths) {
        const path = await app.getPath(name);
        log(`${name}: ${path}`);
      }
    } catch (error: any) {
      log(`错误: ${error.message}`);
    }
  });

// 4. 获取系统语言
document.getElementById("btn-locale")?.addEventListener("click", async () => {
  clear();
  log("=== 系统语言 ===");
  try {
    const locale = await app.getLocale();
    log(`系统语言: ${locale}`);
  } catch (error: any) {
    log(`错误: ${error.message}`);
  }
});

// 5. 单实例锁测试
document.getElementById("btn-single-instance")?.addEventListener("click", async () => {
  clear();
  log("=== 单实例锁测试 ===");
  log("尝试请求单实例锁...");
  try {
    const isFirstInstance = await app.requestSingleInstanceLock();
    if (isFirstInstance) {
      log("✅ 成功获取单实例锁！");
      log("   当前是首个实例，可以正常运行。");
      log("   提示：尝试再次启动应用，新实例会返回 false");
    } else {
      log("❌ 获取单实例锁失败！");
      log("   已有实例在运行，当前实例应该退出。");
    }
  } catch (error: any) {
    log(`错误: ${error.message}`);
  }
});

// 6. 测试事件监听
document.getElementById("btn-events")?.addEventListener("click", async () => {
  clear();
  log("=== 事件监听测试 ===");
  log("已注册事件监听器:");
  log("- app.ready: 应用初始化完成");
  log("- app.before-quit: 应用即将退出");
  log("");
  log("提示: 关闭窗口时会触发 before-quit 事件");
});

// 7. 发送系统通知
document.getElementById("btn-notification")?.addEventListener("click", async () => {
  clear();
  log("=== 系统通知测试 ===");
  
  try {
    log("正在发送通知...");
    await notification.show({
      title: "Vokex 通知",
      body: "这是一条来自 Vokex 应用的系统通知！",
    });
    log("✅ 通知已发送");
  } catch (error: any) {
    log(`错误: ${error.message || error}`);
    console.error("Notification error:", error);
  }
});

// 8. 重启应用
document.getElementById("btn-restart")?.addEventListener("click", async () => {
  clear();
  log("正在重启应用...");
  try {
    await app.restart();
  } catch (error: any) {
    log(`错误: ${error.message}`);
  }
});

// 9. 退出应用
document.getElementById("btn-quit")?.addEventListener("click", async () => {
  clear();
  log("正在退出应用...");
  try {
    await app.quit();
  } catch (error: any) {
    log(`错误: ${error.message}`);
  }
});

// ==================== 文件系统 API 测试 ====================

// 10. 文件系统完整演示
document.getElementById("btn-fs-demo")?.addEventListener("click", async () => {
  clear();
  log("=== 文件系统完整演示 ===");

  try {
    const appPath = await app.getAppPath();
    const testDir = `${appPath}\\test_demo`;
    const testFile = `${testDir}\\test.txt`;
    const copyFile = `${testDir}\\test_copy.txt`;

    alert(`应用路径: ${appPath}，测试目录: ${testDir}，测试文件: ${testFile}，复制文件: ${copyFile}`);
    log(`1. 检查目录是否存在: ${testDir}`);
    const dirExists = await fs.exists(testDir);
    if (!dirExists) {
      log(`2. 创建目录: ${testDir}`);
      await fs.createDir(testDir);
    } else {
      log(`2. 目录已存在: ${testDir}`);
    }

    log(`3. 写入文件: ${testFile}`);
    const content = `这是一个测试文件\n创建时间: ${new Date().toString()}\n来自 Vokex fs API`;
    await fs.writeFile(testFile, content);

    log(`4. 读取文件内容:`);
    const readContent = await fs.readFile(testFile);
    log(`---\n${readContent}\n---`);

    log(`5. 复制文件到: ${copyFile}`);
    await fs.copyFile(testFile, copyFile);

    log(`6. 读取目录内容: ${testDir}`);
    const entries = await fs.readDir(testDir);
    log(`目录包含 ${entries.length} 个条目:`);
    entries.forEach(entry => {
      log(`  ${entry.isDir ? "📁" : "📄"} ${entry.name}`);
    });

    log(`7. 获取文件信息: ${testFile}`);
    const stat = await fs.stat(testFile);
    log(`  是否文件: ${stat.isFile}`);
    log(`  是否目录: ${stat.isDir}`);
    log(`  文件大小: ${stat.size} 字节`);

    log("\n✅ 演示完成！所有操作成功");
    log(`   测试文件位置: ${testFile}`);
  } catch (error: any) {
    log(`❌ 错误: ${error.message}`);
  }
});

// 11. 读取文件测试
document.getElementById("btn-fs-read")?.addEventListener("click", async () => {
  clear();
  log("=== 读取文件测试 ===");
  log("尝试读取 test.txt...");

  try {
    const content = await fs.readFile("test_demo/test.txt");
    log(`文件内容 (前 300 字符):\n---\n${content.slice(0, 300)}...\n---`);
    log(`文件总长度: ${content.length} 字符`);
  } catch (error: any) {
    log(`❌ 错误: ${error.message}`);
    log("提示: 请确保在正确的工作目录运行");
  }
});

// 12. 写入文件测试
document.getElementById("btn-fs-write")?.addEventListener("click", async () => {
  clear();
  log("=== 写入文件测试 ===");

  const fileName = `test_demo/test_${Date.now()}.txt`;
  const content = `Hello from Vokex!\nTimestamp: ${Date.now()}\n这是通过 fs.writeFile 写入的文件。`;

  try {
    await fs.writeFile(fileName, content);
    log(`✅ 文件已写入: ${fileName}`);
    log(`文件内容:\n---\n${content}\n---`);

    const exists = await fs.exists(fileName);
    log(`文件存在: ${exists}`);

    const stat = await fs.stat(fileName);
    log(`文件大小: ${stat.size} 字节`);
  } catch (error: any) {
    log(`❌ 错误: ${error.message}`);
  }
});

// 13. 读取目录测试
document.getElementById("btn-fs-readdir")?.addEventListener("click", async () => {
  clear();
  log("=== 读取目录测试 ===");
  log("当前目录内容:");

  try {
    const entries = await fs.readDir(".");
    entries.forEach(entry => {
      const icon = entry.isDir ? "📁" : "📄";
      log(`  ${icon} ${entry.name}`);
    });
    log(`\n总共 ${entries.length} 个条目`);
  } catch (error: any) {
    log(`❌ 错误: ${error.message}`);
  }
});

// 14. 文件信息测试
document.getElementById("btn-fs-stat")?.addEventListener("click", async () => {
  clear();
  log("=== 文件信息测试 ===");

  try {
    const stat = await fs.stat("test_demo/test.txt");
    log(`test_demo/test.txt:`);
    log(`  isFile: ${stat.isFile}`);
    log(`  isDir: ${stat.isDir}`);
    log(`  size: ${stat.size} bytes`);
    log(`  modified: ${stat.modified} seconds ago`);
  } catch (error: any) {
    log(`❌ 错误: ${error.message}`);
  }
});

// 15. 复制文件测试
document.getElementById("btn-fs-copy")?.addEventListener("click", async () => {
  clear();
  log("=== 复制文件测试 ===");

  const src = "test_demo/test.txt";
  const dest = "test_demo/test.txt.copy";

  try {
    await fs.copyFile(src, dest);
    log(`✅ 已复制 ${src} -> ${dest}`);
    const exists = await fs.exists(dest);
    log(`目标文件存在: ${exists}`);
    const stat = await fs.stat(dest);
    log(`目标文件大小: ${stat.size} bytes`);
  } catch (error: any) {
    log(`❌ 错误: ${error.message}`);
  }
});

// 页面加载完成后记录
log("页面已加载");
log(
  "可用 API: app.quit(), app.exit(code), app.restart(), app.getAppPath(), app.getPath(name), app.getVersion(), app.getName(), app.setName(name), app.getLocale(), app.setDockBadge(text), app.requestSingleInstanceLock(), app.setProxy(config), app.on(event, callback), notification.show(options), notification.isSupported()",
);
log(
  "fs API: fs.readFile, fs.readFileBinary, fs.writeFile, fs.appendFile, fs.deleteFile, fs.readDir, fs.createDir, fs.removeDir, fs.stat, fs.exists, fs.copyFile, fs.moveFile",
);
