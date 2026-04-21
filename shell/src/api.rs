use serde_json::{json, Value};
use crate::app_config;

/// 处理 API 调用分发
pub fn handle_api_call(method: &str, args: &Value) -> Result<Value, String> {
    let parts: Vec<&str> = method.split('.').collect();
    if parts.len() != 2 {
        return Err("Invalid method format".to_string());
    }

    let namespace = parts[0];
    let method_name = parts[1];

    match namespace {
        "window" => handle_window_api(method_name, args),
        "fs" => handle_fs_api(method_name, args),
        "app" => handle_app_api(method_name, args),
        "process" => handle_process_api(method_name, args),
        "dialog" => handle_dialog_api(method_name, args),
        "clipboard" => handle_clipboard_api(method_name, args),
        "notification" => handle_notification_api(method_name, args),
        "shell" => handle_shell_api(method_name, args),
        _ => Err(format!("Unknown namespace: {}", namespace)),
    }
}

/// 窗口相关 API
fn handle_window_api(_method: &str, _args: &Value) -> Result<Value, String> {
    // TODO: Implement window API
    Ok(Value::Null)
}

/// 文件系统相关 API
fn handle_fs_api(method: &str, args: &Value) -> Result<Value, String> {
    match method {
        "readFile" => {
            let path = args.get(0).and_then(|v| v.as_str()).ok_or("Missing path argument")?;
            std::fs::read_to_string(path)
                .map(|content| json!(content))
                .map_err(|e| e.to_string())
        }
        "readFileBinary" => {
            let path = args.get(0).and_then(|v| v.as_str()).ok_or("Missing path argument")?;
            std::fs::read(path)
                .map(|bytes| serde_json::to_value(bytes).unwrap_or(Value::Null))
                .map_err(|e| e.to_string())
        }
        "writeFile" => {
            let path = args.get(0).and_then(|v| v.as_str()).ok_or("Missing path argument")?;
            let data = args.get(1).and_then(|v| v.as_str()).ok_or("Missing data argument")?;
            std::fs::write(path, data)
                .map(|_| Value::Null)
                .map_err(|e| e.to_string())
        }
        "appendFile" => {
            let path = args.get(0).and_then(|v| v.as_str()).ok_or("Missing path argument")?;
            let data = args.get(1).and_then(|v| v.as_str()).ok_or("Missing data argument")?;
            use std::io::Write;
            std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(path)
                .and_then(|mut file| file.write_all(data.as_bytes()))
                .map(|_| Value::Null)
                .map_err(|e| e.to_string())
        }
        "deleteFile" => {
            let path = args.get(0).and_then(|v| v.as_str()).ok_or("Missing path argument")?;
            std::fs::remove_file(path)
                .map(|_| Value::Null)
                .map_err(|e| e.to_string())
        }
        "readDir" => {
            let path = args.get(0).and_then(|v| v.as_str()).ok_or("Missing path argument")?;
            let mut entries = Vec::new();
            let read_result = std::fs::read_dir(path);
            match read_result {
                Ok(dir_entries) => {
                    for entry in dir_entries {
                        if let Ok(entry) = entry {
                            let file_name = entry.file_name().into_string().unwrap_or_default();
                            let path = entry.path().to_string_lossy().to_string();
                            let is_dir = entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
                            entries.push(json!({
                                "name": file_name,
                                "path": path,
                                "isDir": is_dir
                            }));
                        }
                    }
                    Ok(json!(entries))
                }
                Err(e) => Err(e.to_string()),
            }
        }
        "createDir" => {
            let path = args.get(0).and_then(|v| v.as_str()).ok_or("Missing path argument")?;
            std::fs::create_dir_all(path)
                .map(|_| Value::Null)
                .map_err(|e| e.to_string())
        }
        "removeDir" => {
            let path = args.get(0).and_then(|v| v.as_str()).ok_or("Missing path argument")?;
            std::fs::remove_dir_all(path)
                .map(|_| Value::Null)
                .map_err(|e| e.to_string())
        }
        "stat" => {
            let path = args.get(0).and_then(|v| v.as_str()).ok_or("Missing path argument")?;
            let metadata = std::fs::metadata(path).map_err(|e| e.to_string())?;
            Ok(json!({
                "isFile": metadata.is_file(),
                "isDir": metadata.is_dir(),
                "size": metadata.len(),
                "modified": metadata.modified().map(|m| m.elapsed().ok().map(|e| e.as_secs())).ok().flatten()
            }))
        }
        "exists" => {
            let path = args.get(0).and_then(|v| v.as_str()).ok_or("Missing path argument")?;
            Ok(json!(std::path::Path::new(path).exists()))
        }
        "copyFile" => {
            let source = args.get(0).and_then(|v| v.as_str()).ok_or("Missing source argument")?;
            let destination = args.get(1).and_then(|v| v.as_str()).ok_or("Missing destination argument")?;
            std::fs::copy(source, destination)
                .map(|_| Value::Null)
                .map_err(|e| e.to_string())
        }
        "moveFile" => {
            let source = args.get(0).and_then(|v| v.as_str()).ok_or("Missing source argument")?;
            let destination = args.get(1).and_then(|v| v.as_str()).ok_or("Missing destination argument")?;
            std::fs::rename(source, destination)
                .map(|_| Value::Null)
                .map_err(|e| e.to_string())
        }
        "watch" => {
            Err("该功能实现待定".to_string())
        }
        _ => Err(format!("Unknown fs method: {}", method)),
    }
}

/// 应用相关 API
fn handle_app_api(method: &str, args: &Value) -> Result<Value, String> {
    let config = app_config::get_config().clone();
    match method {
        // 应用生命周期控制
        "quit" => {
            // 触发 before-quit 事件后退出
            // 注意：实际退出逻辑需要在事件循环中处理
            std::process::exit(0);
        }
        "exit" => {
            let code = args.get(0).and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            std::process::exit(code);
        }
        "restart" => {
            // 重启应用：获取当前可执行文件路径并重新启动
            if let Ok(exe_path) = std::env::current_exe() {
                let _ = std::process::Command::new(exe_path)
                    .spawn()
                    .map_err(|e| e.to_string())?;
                std::process::exit(0);
            }
            Err("Failed to get current exe path".to_string())
        }
        // 路径相关
        "getAppPath" => {
            std::env::current_exe()
                .map(|p| json!(p.parent().and_then(|parent| parent.to_str()).unwrap_or("")))
                .map_err(|e| e.to_string())
        }
        "getPath" => {
            let name = args.get(0).and_then(|v| v.as_str()).unwrap_or("");
            let path = match name {
                "home" => dirs::home_dir(),
                "appData" => dirs::data_dir(),
                "desktop" => dirs::desktop_dir(),
                "documents" => dirs::document_dir(),
                "downloads" => dirs::download_dir(),
                "pictures" => dirs::picture_dir(),
                "music" => dirs::audio_dir(),
                "videos" => dirs::video_dir(),
                "temp" => Some(std::env::temp_dir()),
                "exe" => std::env::current_exe().ok(),
                _ => None,
            };
            match path {
                Some(p) => Ok(json!(p.to_str().unwrap_or(""))),
                None => Err(format!("Unknown path name: {}", name)),
            }
        }

        // 应用信息
        "getVersion" => Ok(json!(config.version)),
        "getName" => Ok(json!(config.name)),
        "setName" => {
            Err("该功能实现待定".to_string())
        }
        "getLocale" => {
            // 获取系统语言标识
            let locale = sys_locale::get_locale()
                .map(|s| s.to_string())
                .unwrap_or_else(|| "en-US".to_string());
            Ok(json!(locale))
        }

        // macOS 特有功能
        "setDockBadge" => {
            Err("该功能实现待定".to_string())
        }

        // 单实例锁
        "requestSingleInstanceLock" => {
            use fs2::FileExt;
            use std::fs::OpenOptions;
            use std::io::Write;

            let identifier = &config.identifier;
            let lock_file_path = if cfg!(target_os = "windows") {
                std::env::temp_dir().join(format!("{}.lock", identifier))
            } else {
                dirs::runtime_dir()
                    .or_else(dirs::cache_dir)
                    .unwrap_or_else(std::env::temp_dir)
                    .join(format!("{}.lock", identifier))
            };

            // 打开或创建锁文件
            let lock_file = OpenOptions::new()
                .write(true)
                .create(true)
                .truncate(true)
                .open(&lock_file_path)
                .map_err(|e| e.to_string())?;

            // 尝试获取独占锁（非阻塞）
            match lock_file.try_lock_exclusive() {
                Ok(()) => {
                    // 成功获取锁，写入 PID
                    let pid = std::process::id();
                    let _ = writeln!(&lock_file, "{}", pid);
                    // 保持文件句柄打开，锁才会持续有效
                    // 使用 Box::leak 让文件句柄在进程生命周期内保持打开
                    let _ = Box::leak(Box::new(lock_file));
                    Ok(json!(true))
                }
                Err(_) => {
                    // 获取锁失败，说明已有实例在运行
                    Ok(json!(false))
                }
            }
        }

        // 代理设置
        "setProxy" => {
            Err("该功能实现待定".to_string())
        }

        _ => Err(format!("Unknown app method: {}", method)),
    }
}

/// 进程相关 API
fn handle_process_api(method: &str, _args: &Value) -> Result<Value, String> {
    match method {
        // 基础进程信息
        "getPid" => Ok(json!(std::process::id())),
        "getArgv" => {
            let args: Vec<String> = std::env::args().collect();
            Ok(json!(args))
        }
        "getEnv" => {
            let key = _args.get(0).and_then(|v| v.as_str()).ok_or("Missing key argument")?;
            let value = std::env::var(key).ok();
            Ok(json!(value))
        }
        "getPlatform" => Ok(json!(std::env::consts::OS)),
        "getArch" => Ok(json!(std::env::consts::ARCH)),

        // 操作系统信息（原 os 模块）
        "homeDir" => {
            if let Ok(home) = std::env::var("HOME") {
                Ok(json!(home))
            } else if let Ok(home) = std::env::var("USERPROFILE") {
                Ok(json!(home))
            } else {
                Ok(json!(""))
            }
        }
        "tempDir" => {
            Ok(json!(std::env::temp_dir().to_str().unwrap_or("")))
        }
        "hostname" => {
            if let Ok(hostname) = hostname::get() {
                Ok(json!(hostname))
            } else {
                Ok(json!(""))
            }
        }

        // 工作目录和环境变量
        "cwd" => {
            if let Ok(cwd) = std::env::current_dir() {
                Ok(json!(cwd.to_str().unwrap_or("")))
            } else {
                Ok(json!(""))
            }
        }
        "env" => {
            let mut env = serde_json::Map::new();
            for (key, value) in std::env::vars() {
                env.insert(key, json!(value));
            }
            Ok(Value::Object(env))
        }

        // 进程控制
        "exit" => {
            let code = _args.get(0).and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            std::process::exit(code);
        }

        // 性能信息
        "getUptime" => {
            use std::time::{SystemTime, UNIX_EPOCH};
            let uptime = SystemTime::now().duration_since(UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0);
            Ok(json!(uptime))
        }
        "getCpuUsage" => {
            #[cfg(target_os = "windows")]
            {
                use windows_sys::Win32::System::Threading::{GetCurrentProcess, GetProcessTimes};
                use windows_sys::Win32::Foundation::FILETIME;
                use std::mem;

                unsafe {
                    let mut creation_time: FILETIME = mem::zeroed();
                    let mut exit_time: FILETIME = mem::zeroed();
                    let mut kernel_time: FILETIME = mem::zeroed();
                    let mut user_time: FILETIME = mem::zeroed();

                    if GetProcessTimes(GetCurrentProcess(), &mut creation_time, &mut exit_time, &mut kernel_time, &mut user_time) != 0 {
                        let kernel = ((kernel_time.dwHighDateTime as u64) << 32) | (kernel_time.dwLowDateTime as u64);
                        let user = ((user_time.dwHighDateTime as u64) << 32) | (user_time.dwLowDateTime as u64);
                        
                        let kernel_seconds = (kernel as f64) / 1e7;
                        let user_seconds = (user as f64) / 1e7;

                        Ok(json!({
                            "user": user_seconds,
                            "system": kernel_seconds
                        }))
                    } else {
                        Err("Failed to get process times".to_string())
                    }
                }
            }
            #[cfg(not(target_os = "windows"))]
            {
                use std::fs::read_to_string;
                #[cfg(target_os = "linux")]
                {
                    if let Ok(stat) = read_to_string("/proc/self/stat") {
                        let parts: Vec<&str> = stat.split_whitespace().collect();
                        if parts.len() >= 15 {
                            let utime = parts[13].parse::<f64>().unwrap_or(0.0) / unsafe { libc::sysconf(libc::_SC_CLK_TCK) } as f64;
                            let stime = parts[14].parse::<f64>().unwrap_or(0.0) / unsafe { libc::sysconf(libc::_SC_CLK_TCK) } as f64;
                            Ok(json!({
                                "user": utime,
                                "system": stime
                            }))
                        } else {
                            Err("Failed to parse /proc/self/stat".to_string())
                        }
                    } else {
                        Err("Failed to read /proc/self/stat".to_string())
                    }
                }
                #[cfg(not(target_os = "linux"))]
                {
                    Err("getCpuUsage not implemented on this platform".to_string())
                }
            }
        }
        "getMemoryInfo" => {
            #[cfg(target_os = "windows")]
            {
                use windows_sys::Win32::System::ProcessStatus::{GetProcessMemoryInfo, PROCESS_MEMORY_COUNTERS};
                use windows_sys::Win32::System::Threading::GetCurrentProcess;
                use std::mem;

                unsafe {
                    let mut pmc: PROCESS_MEMORY_COUNTERS = mem::zeroed();
                    let pmc_size = mem::size_of::<PROCESS_MEMORY_COUNTERS>() as u32;
                    
                    if GetProcessMemoryInfo(GetCurrentProcess(), &mut pmc, pmc_size) != 0 {
                        Ok(json!({
                            "rss": pmc.WorkingSetSize as u64,
                            "heapTotal": pmc.PagefileUsage as u64,
                            "heapUsed": 0,
                            "external": 0
                        }))
                    } else {
                        Err("Failed to get process memory info".to_string())
                    }
                }
            }
            #[cfg(target_os = "linux")]
            {
                use std::fs::read_to_string;
                let mut rss = 0;
                if let Ok(status) = read_to_string("/proc/self/status") {
                    for line in status.lines() {
                        if line.starts_with("VmRSS:") {
                            let parts: Vec<&str> = line.split_whitespace().collect();
                            if parts.len() >= 2 {
                                rss = parts[1].parse::<u64>().unwrap_or(0) * 1024;
                            }
                        }
                    }
                }
                Ok(json!({
                    "rss": rss,
                    "heapTotal": 0,
                    "heapUsed": 0,
                    "external": 0
                }))
            }
            #[cfg(not(any(target_os = "windows", target_os = "linux")))]
            {
                Err("getMemoryInfo not implemented on this platform".to_string())
            }
        }
        "kill" => {
            let pid = _args.get(0).and_then(|v| v.as_i64()).ok_or("Missing pid argument")?;
            let signal = _args.get(1).and_then(|v| v.as_str()).unwrap_or("TERM");
            
            #[cfg(unix)]
            {
                use nix::sys::signal;
                use nix::unistd::Pid;
                let sig = match signal {
                    "TERM" => signal::SIGTERM,
                    "KILL" => signal::SIGKILL,
                    "INT" => signal::SIGINT,
                    "HUP" => signal::SIGHUP,
                    _ => signal::SIGTERM,
                };
                let res = signal::kill(Pid::from_raw(pid as i32), Some(sig));
                match res {
                    Ok(_) => Ok(Value::Null),
                    Err(e) => Err(e.to_string()),
                }
            }
            #[cfg(windows)]
            {
                use windows_sys::Win32::System::Threading::{OpenProcess, TerminateProcess};
                use windows_sys::Win32::System::Threading::PROCESS_TERMINATE;

                unsafe {
                    let handle = OpenProcess(PROCESS_TERMINATE, 0, pid as u32);
                    if handle != 0 {
                        let result = TerminateProcess(handle, 1);
                        if result != 0 {
                            Ok(Value::Null)
                        } else {
                            Err("Failed to terminate process".to_string())
                        }
                    } else {
                        Err("Failed to open process".to_string())
                    }
                }
            }
            #[cfg(not(any(unix, windows)))]
            {
                Err("kill not implemented on this platform".to_string())
            }
        }
        _ => Err(format!("Unknown process method: {}", method)),
    }
}

/// 对话框相关 API
fn handle_dialog_api(_method: &str, _args: &Value) -> Result<Value, String> {
    // TODO: Implement dialog API
    Ok(Value::Null)
}

/// 剪贴板相关 API
fn handle_clipboard_api(_method: &str, _args: &Value) -> Result<Value, String> {
    // TODO: Implement clipboard API
    Ok(Value::Null)
}

/// 通知选项
#[derive(serde::Deserialize)]
struct NotificationOptions {
    title: String,
    body: Option<String>,
    icon: Option<String>,
    #[allow(dead_code)]
    silent: Option<bool>,
}

/// 在 Windows 上设置 AppUserModelID，使通知显示正确的应用标识
#[cfg(target_os = "windows")]
pub fn set_windows_app_user_model_id() {
    use windows_sys::Win32::UI::Shell::SetCurrentProcessExplicitAppUserModelID;
    
    let config = app_config::get_config();
    // 使用应用标识符作为 AppUserModelID
    let app_id = &config.identifier;
    let app_id_wide: Vec<u16> = app_id.encode_utf16().chain(std::iter::once(0)).collect();
    unsafe {
        let _ = SetCurrentProcessExplicitAppUserModelID(app_id_wide.as_ptr());
    }
}

/// 通知相关 API
fn handle_notification_api(method: &str, args: &Value) -> Result<Value, String> {
    match method {
        "show" => {
            let options = args
                .as_array()
                .and_then(|arr| arr.first())
                .ok_or("Missing notification options")?;

            let options: NotificationOptions = serde_json::from_value(options.clone())
                .map_err(|e| format!("Invalid notification options: {}", e))?;

            if options.title.is_empty() {
                return Err("Notification title cannot be empty".to_string());
            }
            
            let mut notification = notify_rust::Notification::new();
            notification
                .summary(&options.title)
                .appname(&app_config::get_config().identifier);

            if let Some(ref body) = options.body {
                notification.body(body);
            }

            if let Some(ref icon_path) = options.icon {
                notification.icon(icon_path);
            }

            notification
                .show()
                .map(|_| Value::Null)
                .map_err(|e| format!("Notification Error: {}. (Please check if your OS notification service is enabled)", e))
        }
        _ => Err(format!("Unknown notification method: {}", method)),
    }
}

/// ExecOptions 执行命令选项
#[derive(serde::Deserialize)]
struct ExecOptions {
    cwd: Option<String>,
    env: Option<std::collections::HashMap<String, String>>,
}

/// shell 相关 API
fn handle_shell_api(method: &str, args: &Value) -> Result<Value, String> {
    match method {
        "openExternal" => {
            let url = args.get(0).and_then(|v| v.as_str()).ok_or("Missing url argument")?;
            open::that(url)
                .map(|_| Value::Null)
                .map_err(|e| e.to_string())
        }

        "openPath" => {
            let path = args.get(0).and_then(|v| v.as_str()).ok_or("Missing path argument")?;
            open::that(path)
                .map(|_| Value::Null)
                .map_err(|e| e.to_string())
        }

        "execCommand" => {
            let command = args.get(0).and_then(|v| v.as_str()).ok_or("Missing command argument")?;
            let options = args.get(1).cloned();
            
            let exec_options: Option<ExecOptions> = match options {
                Some(opts) => serde_json::from_value(opts).ok(),
                None => None,
            };

            #[cfg(target_os = "windows")]
            let output = {
                use std::process::Command;
                let mut cmd = Command::new("cmd");
                cmd.arg("/C").arg(command);
                if let Some(ref opts) = exec_options {
                    if let Some(cwd) = &opts.cwd {
                        cmd.current_dir(cwd);
                    }
                    if let Some(env) = &opts.env {
                        cmd.envs(env);
                    }
                }
                cmd.output()
            };

            #[cfg(not(target_os = "windows"))]
            let output = {
                use std::process::Command;
                let mut cmd = Command::new("/bin/sh");
                cmd.arg("-c").arg(command);
                if let Some(ref opts) = exec_options {
                    if let Some(cwd) = &opts.cwd {
                        cmd.current_dir(cwd);
                    }
                    if let Some(env) = &opts.env {
                        cmd.envs(env);
                    }
                }
                cmd.output()
            };

            match output {
                Ok(output) => {
                    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                    let code = output.status.code().unwrap_or(-1);
                    let success = output.status.success();

                    Ok(json!({
                        "code": code,
                        "stdout": stdout,
                        "stderr": stderr,
                        "success": success
                    }))
                }
                Err(e) => Err(e.to_string()),
            }
        }

        "trashItem" => {
            let path = args.get(0).and_then(|v| v.as_str()).ok_or("Missing path argument")?;
            trash::delete(path)
                .map(|_| Value::Null)
                .map_err(|e| e.to_string())
        }

        _ => Err(format!("Unknown shell method: {}", method)),
    }
}
