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
        "os" => handle_os_api(method_name, args),
        "process" => handle_process_api(method_name, args),
        "dialog" => handle_dialog_api(method_name, args),
        "clipboard" => handle_clipboard_api(method_name, args),
        "notification" => handle_notification_api(method_name, args),
        _ => Err(format!("Unknown namespace: {}", namespace)),
    }
}

/// 窗口相关 API
fn handle_window_api(_method: &str, _args: &Value) -> Result<Value, String> {
    // TODO: Implement window API
    Ok(Value::Null)
}

/// 文件系统相关 API
fn handle_fs_api(_method: &str, _args: &Value) -> Result<Value, String> {
    // TODO: Implement fs API
    Ok(Value::Null)
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
                .map(|p| json!(p.to_str().unwrap_or("")))
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

/// 操作系统相关 API
fn handle_os_api(method: &str, _args: &Value) -> Result<Value, String> {
    match method {
        "platform" => Ok(json!(std::env::consts::OS)),
        "arch" => Ok(json!(std::env::consts::ARCH)),
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
        _ => Err(format!("Unknown os method: {}", method)),
    }
}

/// 进程相关 API
fn handle_process_api(method: &str, _args: &Value) -> Result<Value, String> {
    match method {
        "pid" => Ok(json!(std::process::id())),
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
        "exit" => {
            std::process::exit(0);
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
    // 使用应用标识符作为 AppUserModelID（格式：公司名.产品名）
    let app_id = format!("{}", config.identifier);
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

            let config = app_config::get_config();
            let app_id = format!("{}", config.identifier);
            
            let mut notification = notify_rust::Notification::new();
            notification
                .summary(&options.title)
                .appname(&app_id);

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
