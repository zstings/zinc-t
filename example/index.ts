import { app, notification } from "vokex";

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
    log("1. 调用 notification.isSupported()...");
    const supported = await notification.isSupported();
    log(`2. 通知支持: ${supported ? "✅ 是" : "❌ 否"}`);
    
    if (supported) {
      log("3. 调用 notification.show()...");
      await notification.show({
        title: "Vokex 通知",
        body: "这是一条来自 Vokex 应用的系统通知！",
      });
      log("4. ✅ 通知已发送");
    } else {
      log("❌ 当前系统不支持通知");
    }
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

// 页面加载完成后记录
log("页面已加载");
log(
  "可用 API: app.quit(), app.exit(code), app.restart(), app.getAppPath(), app.getPath(name), app.getVersion(), app.getName(), app.setName(name), app.getLocale(), app.setDockBadge(text), app.requestSingleInstanceLock(), app.setProxy(config), app.on(event, callback), notification.show(options), notification.isSupported()",
);
