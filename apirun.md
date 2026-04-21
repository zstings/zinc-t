# Vokex API 实现状态统计

> 按照 API 文档顺序统计，格式：API | Rust 后端 | TypeScript 前端 | 示例测试 | 状态 | 依赖库

| API | Rust 后端 | TypeScript 前端 | 示例测试 | 状态 | 依赖库 |
|-----|-----------|----------------|----------|------|--------|
| **1. app** | | | | | |
| `app.quit()` | ✅ | ✅ | ✅ | 完成 | std::process |
| `app.exit(code)` | ✅ | ✅ | ✅ | 完成 | std::process |
| `app.restart()` | ✅ | ✅ | ✅ | 完成 | std::process + std::command |
| `app.getAppPath()` | ✅ | ✅ | ✅ | 完成 | std::env |
| `app.getPath(name)` | ✅ | ✅ | ✅ | 完成 | dirs crate |
| `app.getVersion()` | ✅ | ✅ | ✅ | 完成 | 从 app_config 读取 |
| `app.getName()` | ✅ | ✅ | ✅ | 完成 | 从 app_config 读取 |
| `app.setName(name)` | ✅ | ✅ | ✅ | 未完成(返回错误) | - |
| `app.getLocale()` | ✅ | ✅ | ✅ | 完成 | sys-locale crate |
| `app.setDockBadge(text)` | ✅ | ✅ | ❌ | 未完成(返回错误) | - |
| `app.requestSingleInstanceLock()` | ✅ | ✅ | ✅ | 完成 | fs2 crate (文件锁) |
| `app.hasSingleInstanceLock()` | ❌ | ❌ | ❌ | 未实现 | - |
| `app.setProxy(config)` | ✅ | ✅ | ❌ | 未完成(返回错误) | - |
| `app.on('ready', callback)` | ✅ | ✅ | ✅ | 完成 | 通过 webview evaluateScript |
| `app.on('window-all-closed', callback)` | ❌ | ❌ | ❌ | 未实现 | - |
| `app.on('before-quit', callback)` | ✅ | ✅ | ✅ | 完成 | 通过 webview evaluateScript |
| `app.on('second-instance', callback)` | ❌ | ❌ | ❌ | 未实现 | - |
| `app.on('activate', callback)` | ❌ | ❌ | ❌ | 未实现 | - |
| | | | | | |
| **2. browserWindow** | | | | | |
| `browserWindow.create(options)` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `browserWindow.getAll()` | ❌ | ❌ | ❌ | 未实现 | - |
| `browserWindow.getFocused()` | ❌ | ❌ | ❌ | 未实现 | - |
| `win.close()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.show()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.hide()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.minimize()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.maximize()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.unmaximize()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.restore()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.focus()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.blur()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.isMaximized()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.isMinimized()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.isFullScreen()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.setFullScreen(flag)` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.setTitle(title)` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.getTitle()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.setSize(width, height)` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.getSize()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.setMinimumSize(width, height)` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.setMaximumSize(width, height)` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.setResizable(flag)` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.setAlwaysOnTop(flag)` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.setPosition(x, y)` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.getPosition()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.center()` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.setOpacity(opacity)` | ❌ | ❌ | ❌ | 未实现 | - |
| `win.setBackgroundColor(color)` | ❌ | ❌ | ❌ | 未实现 | - |
| `win.setIcon(icon)` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.loadFile(path)` | ⚠️ | ⚠️ | ❌ | 框架已有(wry)，API 未封装 | wry crate |
| `win.loadURL(url)` | ⚠️ | ⚠️ | ❌ | 框架已有(wry)，API 未封装 | wry crate |
| `win.reload()` | ⚠️ | ⚠️ | ❌ | 框架已有(wry)，API 未封装 | wry crate |
| `win.setProgressBar(progress)` | ❌ | ❌ | ❌ | 未实现 | - |
| `win.setSkipTaskbar(flag)` | ❌ | ❌ | ❌ | 未实现 | - |
| `win.capturePage()` | ❌ | ❌ | ❌ | 未实现 | - |
| `win.on('close', callback)` | ⚠️ | ⚠️ | ❌ | 框架已有(Tao)，API 未封装 | tao crate |
| `win.on('resize', callback)` | ⚠️ | ✅ | ❌ | 已事件注入，API 未封装 | tao crate |
| `win.on('move', callback)` | ⚠️ | ✅ | ❌ | 已事件注入，API 未封装 | tao crate |
| `win.on('minimize', callback)` | ⚠️ | ✅ | ❌ | 已事件注入，API 未封装 | tao crate |
| `win.on('maximize', callback)` | ⚠️ | ✅ | ❌ | 已事件注入，API 未封装 | tao crate |
| `win.on('focus', callback)` | ⚠️ | ✅ | ❌ | 已事件注入，API 未封装 | tao crate |
| `win.on('blur', callback)` | ⚠️ | ✅ | ❌ | 已事件注入，API 未封装 | tao crate |
| `win.on('enter-full-screen', callback)` | ⚠️ | ✅ | ❌ | 已事件注入，API 未封装 | tao crate |
| `win.on('leave-full-screen', callback)` | ⚠️ | ✅ | ❌ | 已事件注入，API 未封装 | tao crate |
| | | | | | |
| **3. dialog** | | | | | |
| `dialog.showOpenDialog(options)` | ⚠️ | ⚠️ | ❌ | 未完成(占位) | - |
| `dialog.showSaveDialog(options)` | ⚠️ | ⚠️ | ❌ | 未完成(占位) | - |
| `dialog.showMessageBox(options)` | ⚠️ | ⚠️ | ❌ | 未完成(占位) | - |
| `dialog.showErrorBox(title, content)` | ❌ | ❌ | ❌ | 未实现 | - |
| `dialog.showColorDialog(options)` | ❌ | ❌ | ❌ | 未实现 | - |
| | | | | | |
| **4. menu** | | | | | |
| `menu.setApplicationMenu(template)` | ❌ | ❌ | ❌ | 未实现 | - |
| `menu.setContextMenu(template)` | ❌ | ❌ | ❌ | 未实现 | - |
| `menu.removeContextMenu()` | ❌ | ❌ | ❌ | 未实现 | - |
| `menu.sendAction(action)` | ❌ | ❌ | ❌ | 未实现 | - |
| | | | | | |
| **5. tray** | | | | | |
| `tray.create(options)` | ❌ | ❌ | ❌ | 未实现 | - |
| `tray.setToolTip(text)` | ❌ | ❌ | ❌ | 未实现 | - |
| `tray.setTitle(title)` | ❌ | ❌ | ❌ | 未实现 | - |
| `tray.setMenu(template)` | ❌ | ❌ | ❌ | 未实现 | - |
| `tray.setImage(icon)` | ❌ | ❌ | ❌ | 未实现 | - |
| `tray.destroy()` | ❌ | ❌ | ❌ | 未实现 | - |
| `tray.displayBalloon(options)` | ❌ | ❌ | ❌ | 未实现 | - |
| `tray.on('click', callback)` | ❌ | ❌ | ❌ | 未实现 | - |
| `tray.on('right-click', callback)` | ❌ | ❌ | ❌ | 未实现 | - |
| `tray.on('double-click', callback)` | ❌ | ❌ | ❌ | 未实现 | - |
| | | | | | |
| **6. clipboard** | | | | | |
| `clipboard.readText()` | ⚠️ | ⚠️ | ❌ | 未完成(占位) | - |
| `clipboard.writeText(text)` | ⚠️ | ⚠️ | ❌ | 未完成(占位) | - |
| `clipboard.readImage()` | ❌ | ❌ | ❌ | 未实现 | - |
| `clipboard.writeImage(image)` | ❌ | ❌ | ❌ | 未实现 | - |
| `clipboard.readHTML()` | ❌ | ❌ | ❌ | 未实现 | - |
| `clipboard.writeHTML(html)` | ❌ | ❌ | ❌ | 未实现 | - |
| `clipboard.hasText()` | ❌ | ❌ | ❌ | 未实现 | - |
| `clipboard.clear()` | ⚠️ | ⚠️ | ❌ | 未完成(占位) | - |
| | | | | | |
| **7. notification** | | | | | |
| `notification.show(options)` | ✅ | ✅ | ✅ | 完成 | notify-rust crate |
| `notification.isSupported()` | ❌ | ❌ | ❌ | 未实现 | - |
| | | | | | |
| **8. screen** | | | | | |
| `screen.getAllDisplays()` | ❌ | ❌ | ❌ | 未实现 | - |
| `screen.getPrimaryDisplay()` | ❌ | ❌ | ❌ | 未实现 | - |
| `screen.getCursorScreenPoint()` | ❌ | ❌ | ❌ | 未实现 | - |
| | | | | | |
| **9. fs** | | | | | |
| `fs.readFile(path)` | ✅ | ✅ | ✅ | 完成 | std::fs |
| `fs.readFileBinary(path)` | ✅ | ✅ | ✅ | 完成 | std::fs |
| `fs.writeFile(path, data)` | ✅ | ✅ | ✅ | 完成 | std::fs |
| `fs.appendFile(path, data)` | ✅ | ✅ | ✅ | 完成 | std::fs |
| `fs.deleteFile(path)` | ✅ | ✅ | ✅ | 完成 | std::fs |
| `fs.readDir(path)` | ✅ | ✅ | ✅ | 完成 | std::fs |
| `fs.createDir(path)` | ✅ | ✅ | (自动使用) | 完成 | std::fs |
| `fs.removeDir(path)` | ✅ | ✅ | ✅ | 完成 | std::fs |
| `fs.stat(path)` | ✅ | ✅ | ✅ | 完成 | std::fs |
| `fs.exists(path)` | ✅ | ✅ | (自动使用) | 完成 | std::path::Path |
| `fs.copyFile(source, destination)` | ✅ | ✅ | ✅ | 完成 | std::fs |
| `fs.moveFile(source, destination)` | ✅ | ✅ | ✅ | 完成 | std::fs |
| `fs.watch(path)` | ✅ | ✅ | ❌ | 未完成(返回"该功能实现待定") | - |
| | | | | | |
| **10. shell** | | | | | |
| `shell.openExternal(url)` | ✅ | ✅ | ❌ | 完成 | 原生 open 调用 |
| `shell.openPath(path)` | ✅ | ✅ | ❌ | 完成 | 原生 open 调用 |
| `shell.execCommand(command, options?)` | ✅ | ✅ | ❌ | 完成 | std::process::Command |
| `shell.trashItem(path)` | ❌ | ❌ | ❌ | 未实现 | - |
| | | | | | |
| **11. process** | | | | | |
| `process.getPid()` | ✅ | ✅ | ✅ | 完成 | std::process |
| `process.getArgv()` | ✅ | ✅ | ✅ | 完成 | std::env |
| `process.getEnv(key)` | ✅ | ✅ | ✅ | 完成 | std::env |
| `process.getPlatform()` | ✅ | ✅ | ✅ | 完成 | std::env::consts |
| `process.getArch()` | ✅ | ✅ | ✅ | 完成 | std::env::consts |
| `process.getUptime()` | ✅ | ✅ | ✅ | 完成 | std::time |
| `process.getCpuUsage()` | ✅ | ✅ | ✅ | 完成 | Windows: windows-sys; Linux: libc/std::fs |
| `process.getMemoryInfo()` | ✅ | ✅ | ✅ | 完成 | Windows: windows-sys; Linux: std::fs |
| `process.exit(code)` | ✅ | ✅ | ✅ | 完成 | std::process |
| `process.kill(pid, signal?)` | ✅ | ✅ | ❌ | 完成 | Unix: nix crate; Windows: windows-sys |
| `process.on('exit', callback)` | ❌ | ❌ | ❌ | 未实现 (需要事件架构) | - |
| | | | | | |
| **12. events** | | | | | |
| *(全局事件总线，未开始)* | | | | | |
| | | | | | |
| **13. storage** | | | | | |
| `storage.setData(key, value)` | ✅ | ✅ | ✅ | 完成 | 原生 fs + JSON 序列化 |
| `storage.getData(key)` | ✅ | ✅ | ✅ | 完成 | 原生 fs + JSON 序列化 |
| `storage.getKeys()` | ✅ | ✅ | ✅ | 完成 | 原生 fs + JSON 序列化 |
| `storage.has(key)` | ✅ | ✅ | ✅ | 完成 | 原生 fs + JSON 序列化 |
| `storage.removeData(key)` | ✅ | ✅ | ✅ | 完成 | 原生 fs + JSON 序列化 |
| `storage.clear()` | ✅ | ✅ | ✅ | 完成 | 原生 fs + JSON 序列化 |
| | | | | | |
| **14. computer** | | | | | |
| `computer.getCpuInfo()` | ✅ (Windows) | ✅ | ✅ | 完成 (Windows) | windows-sys |
| `computer.getMemoryInfo()` | ✅ (Windows) | ✅ | ✅ | 完成 (Windows) | windows-sys |
| `computer.getOsInfo()` | ✅ (Windows) | ✅ | ✅ | 完成 (Windows) | windows-sys |
| `computer.getDisplays()` | ✅ (Windows) | ✅ | ✅ | 完成 (Windows) | windows-sys |
| `computer.getMousePosition()` | ✅ (Windows) | ✅ | ✅ | 完成 (Windows) | windows-sys |
| `computer.getKeyboardLayout()` | ✅ (Windows) | ✅ | ✅ | 完成 (Windows) | windows-sys |
| | | | | | |
| **15. http** | | | | | |
| `http.get(url, options?)` | ✅ | ✅ | ✅ | 完成 | reqwest (blocking) |
| `http.post(url, data, options?)` | ✅ | ✅ | ✅ | 完成 | reqwest (blocking) |
| `http.put(url, data, options?)` | ✅ | ✅ | ✅ | 完成 | reqwest (blocking) |
| `http.delete(url, options?)` | ✅ | ✅ | ✅ | 完成 | reqwest (blocking) |
| `http.request(options)` | ✅ | ✅ | ✅ | 完成 | reqwest (blocking) |
| | | | | | |
| **16. shortcut** | | | | | |
| *(未开始)* | | | | | |

---

## 统计汇总

| 项目 | 数量 |
|------|------|
| **总计 API** | 140+ |
| **已完成** | 33 + 17 = 50 |
| **框架已有(Tao/Wry)，API 未封装** | ~45 |
| **未完成/未实现** | ~45+ |

**已完成模块：**
- ✅ app - 13/24 完成
- ✅ fs - 12/13 完成 (仅 fs.watch 未完成)
- ✅ process - 10/11 完成 (仅 process.on('exit') 未完成)
- ✅ notification - 1/2 完成
- ✅ computer - 6/6 完成 (Windows 平台)
- ✅ http - 5/5 完成
- ✅ storage - 6/6 完成
