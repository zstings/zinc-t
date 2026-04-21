// release 模式下隐藏控制台窗口，debug 模式下显示
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod api;
mod app_config;
mod args_utils;
use std::fs::File;
use std::io::{self, Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use flate2::read::ZlibDecoder;
use serde::Deserialize;
use serde_json::Value;
use tao::event::{WindowEvent};
use tao::event_loop::{EventLoop};
use tao::window::{WindowBuilder};
use tao::dpi::LogicalSize;
use wry::http::Response;
use wry::{WebView, WebViewBuilder, WebContext};

const MAGIC: &[u8] = b"VOKEX";
const MAGIC_SIZE: usize = 5;
const INDEX_LENGTH_SIZE: usize = 4;
const OFFSET_SIZE: usize = 8;

#[derive(Deserialize)]
struct IpcMessage {
    id: String,
    method: String,
    args: Value,
}

#[derive(Debug)]
pub struct Resources {
    index: serde_json::Map<String, Value>,
    data: Vec<u8>,
}

impl Resources {
    pub fn load_from_exe(exe_path: &Path) -> io::Result<Self> {
        let mut file = File::open(exe_path)?;
        let file_size = file.metadata()?.len();

        if file_size < OFFSET_SIZE as u64 {
            return Err(io::Error::new(io::ErrorKind::InvalidData, "File too small"));
        }

        file.seek(SeekFrom::End(-(OFFSET_SIZE as i64)))?;
        let mut offset_buf = [0u8; OFFSET_SIZE];
        file.read_exact(&mut offset_buf)?;
        let offset = u64::from_le_bytes(offset_buf);

        if offset >= file_size {
            return Err(io::Error::new(io::ErrorKind::InvalidData, "Invalid offset"));
        }

        file.seek(SeekFrom::Start(offset))?;
        let mut magic_buf = [0u8; MAGIC_SIZE];
        file.read_exact(&mut magic_buf)?;

        if magic_buf != MAGIC {
            return Err(io::Error::new(io::ErrorKind::InvalidData, "Invalid magic"));
        }

        let mut index_length_buf = [0u8; INDEX_LENGTH_SIZE];
        file.read_exact(&mut index_length_buf)?;
        let index_length = u32::from_le_bytes(index_length_buf) as usize;

        let mut index_json = vec![0u8; index_length];
        file.read_exact(&mut index_json)?;
        let index: serde_json::Map<String, Value> = serde_json::from_slice(&index_json)?;

        // 压缩数据长度 = 文件大小 - offset - MAGIC - indexLen字段 - index - offset字段
        let compressed_data_length = file_size - offset - MAGIC_SIZE as u64 - INDEX_LENGTH_SIZE as u64 - index_length as u64 - OFFSET_SIZE as u64;
        let mut compressed_data = vec![0u8; compressed_data_length as usize];
        file.read_exact(&mut compressed_data)?;

        let mut decoder = ZlibDecoder::new(&compressed_data[..]);
        let mut data = Vec::new();
        decoder.read_to_end(&mut data)?;

        Ok(Self {
            index,
            data,
        })
    }

    pub fn get(&self, path: &str) -> Option<&[u8]> {
        if let Some(Value::Array(offsets)) = self.index.get(path) {
            if offsets.len() == 2 {
                if let (Some(Value::Number(start)), Some(Value::Number(end))) = (
                    offsets.get(0),
                    offsets.get(1),
                ) {
                    let start = start.as_u64()? as usize;
                    let end = end.as_u64()? as usize;
                    if end <= self.data.len() {
                        return Some(&self.data[start..end]);
                    }
                }
            }
        }
        None
    }

    pub fn keys(&self) -> impl Iterator<Item = &String> {
        self.index.keys()
    }

    pub fn get_meta(&self, key: &str) -> Option<&str> {
        self.index.get(key).and_then(|v| v.as_str())
    }
}

fn main() {

    app_config::init_app_config();

    // 在 Windows 上设置 AppUserModelID，使通知显示正确的应用标识
    #[cfg(target_os = "windows")]
    api::set_windows_app_user_model_id();

    let app_config = app_config::get_config().clone();

    

    let args: Vec<String> = std::env::args().collect();
    let mut dev_mode = false;
    let mut dev_dir: Option<PathBuf> = None;
    let mut dev_url = None;

    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--dev" => {
                dev_mode = true;
                i += 1;
            }
            "--dev-dir" => {
                if i + 1 < args.len() {
                    dev_dir = Some(PathBuf::from(&args[i + 1]));
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "--dev-url" => {
                if i + 1 < args.len() {
                    dev_url = Some(args[i + 1].clone());
                    dev_mode = true;
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "--app-config" => {
                // 配置已由 app_config 模块处理，这里只需跳过参数
                if i + 1 < args.len() {
                    i += 2;
                } else {
                    i += 1;
                }
            }
            _ => {
                i += 1;
            }
        }
    }

    let mut resources = None;
    if !dev_mode {
        if let Ok(exe_path) = std::env::current_exe() {
            match Resources::load_from_exe(&exe_path) {
                Ok(res) => {
                    resources = Some(Arc::new(res));
                }
                Err(e) => {
                    eprintln!("Failed to load resources: {}", e);
                }
            }
        } else {
            eprintln!("Failed to get current exe path");
        }
    }

    #[cfg(target_os = "windows")]
    let mut web_context = if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
        let data_dir = PathBuf::from(local_appdata).join(app_config.identifier);
        std::fs::create_dir_all(&data_dir).ok();
        WebContext::new(Some(data_dir))
    } else {
        WebContext::new(None)
    };

    #[cfg(not(target_os = "windows"))]
    let mut web_context = WebContext::new(None);

    let event_loop = EventLoop::new();
    let window = WindowBuilder::new()
        .with_title(app_config.window.title)
        .with_inner_size(LogicalSize::new(
            app_config.window.width,
            app_config.window.height
        ))
        .build(&event_loop)
        .unwrap();

    let init_script = r#"
    window.__VOKEX__ = {
        __callbacks: {},
        __nextId: 0,
        call: function(method, args) {
            return new Promise((resolve, reject) => {
                const id = String(this.__nextId++);
                this.__callbacks[id] = { resolve, reject };
                window.ipc.postMessage(JSON.stringify({
                    id,
                    method,
                    args
                }));
            });
        },
        __resolve: function(id, code, message, data) {
            const callback = this.__callbacks[id];
            if (callback) {
                delete this.__callbacks[id];
                if (code === 0) {
                    callback.resolve(data);
                } else {
                    callback.reject(new Error(message));
                }
            }
        },
        __emit: function(event, data) {
            const eventListeners = this.__eventListeners || {};
            const listeners = eventListeners[event] || [];
            for (const listener of listeners) {
                try {
                    listener(data);
                } catch (e) {
                    console.error("Error in event listener:", e);
                }
            }
        },
        on: function(event, listener) {
            this.__eventListeners = this.__eventListeners || {};
            this.__eventListeners[event] = this.__eventListeners[event] || [];
            this.__eventListeners[event].push(listener);
        },
        off: function(event, listener) {
            if (this.__eventListeners && this.__eventListeners[event]) {
                this.__eventListeners[event] = this.__eventListeners[event].filter(
                    l => l !== listener
                );
            }
        }
    };
    "#;

    let webview_arc = Arc::new(Mutex::new(None));
    let webview_arc_clone = webview_arc.clone();

    let initial_url = if let Some(ref url) = dev_url {
        url.clone()
    } else {
        "vokex://index.html".to_string()
    };

    let webview = if dev_url.is_some() {
        WebViewBuilder::new_with_web_context(&mut web_context)
            .with_initialization_script(init_script)
            .with_url(&initial_url)
            .with_devtools(true)
            .with_ipc_handler(move |message| {
                if let Ok(webview_guard) = webview_arc_clone.lock() {
                    if let Some(webview) = &*webview_guard {
                        handle_ipc_message(webview, message);
                    }
                }
            })
            .build(&window)
            .unwrap()
    } else {
        let resources_clone = resources.clone();
        
        WebViewBuilder::new_with_web_context(&mut web_context)
            .with_initialization_script(init_script)
            .with_url(&initial_url)
            .with_devtools(dev_mode)
            .with_custom_protocol("vokex".to_string(), move |_webview_id, request| {
                let uri = request.uri();
                let path = uri.path().trim_start_matches('/');
                let path = if path.is_empty() { "index.html" } else { path };

                if dev_mode {
                    if let Some(ref dev_dir) = dev_dir {
                        let dev_dir_abs = if dev_dir.is_absolute() {
                            dev_dir.clone()
                        } else {
                            match std::env::current_dir() {
                                Ok(cwd) => cwd.join(dev_dir),
                                Err(_) => dev_dir.clone(),
                            }
                        };
                        let file_path = dev_dir_abs.join(path);
                        if let Ok(mut file) = File::open(&file_path) {
                            let mut content = Vec::new();
                            if file.read_to_end(&mut content).is_ok() {
                                let mime = mime_guess::from_path(path)
                                    .first_or_text_plain()
                                    .to_string();
                                let body: std::borrow::Cow<[u8]> = content.into();
                                return Response::builder()
                                    .header("Content-Type", mime)
                                    .body(body)
                                    .unwrap();
                            }
                        }
                    }
                } else if let Some(ref resources) = resources_clone {
                    if let Some(content) = resources.get(path) {
                        let mime = mime_guess::from_path(path)
                            .first_or_text_plain()
                            .to_string();
                        let body: std::borrow::Cow<[u8]> = content.to_vec().into();
                        return Response::builder()
                            .header("Content-Type", mime)
                            .body(body)
                            .unwrap();
                    }
                }

                let body: std::borrow::Cow<[u8]> = Vec::from("Not Found").into();
                Response::builder()
                    .status(404)
                    .body(body)
                    .unwrap()
            })
            .with_ipc_handler(move |message| {
                if let Ok(webview_guard) = webview_arc_clone.lock() {
                    if let Some(webview) = &*webview_guard {
                        handle_ipc_message(webview, message);
                    }
                }
            })
            .build(&window)
            .unwrap()
    };

    *webview_arc.lock().unwrap() = Some(webview);

    // 触发 app.ready 事件
    if let Ok(webview_guard) = webview_arc.lock() {
        if let Some(ref webview) = *webview_guard {
            webview.evaluate_script("window.__VOKEX__.__emit('app.ready', {})")
                .unwrap_or(());
        }
    }

    let webview = webview_arc;
    let _window = Some(window);

    event_loop.run(move |event, _, control_flow| {
        *control_flow = tao::event_loop::ControlFlow::Wait;

        match event {
            tao::event::Event::WindowEvent { event, .. } => {
                match event {
                    WindowEvent::CloseRequested => {
                        // 触发 app.before-quit 事件
                        if let Ok(webview_guard) = webview.lock() {
                            if let Some(ref webview) = *webview_guard {
                                webview.evaluate_script("window.__VOKEX__.__emit('app.before-quit', {})")
                                    .unwrap_or(());
                            }
                        }
                        if let Ok(webview_guard) = webview.lock() {
                            if let Some(ref webview) = *webview_guard {
                                webview.evaluate_script("window.__VOKEX__.__emit('window.closed', {})").unwrap_or(());
                            }
                        }
                        *control_flow = tao::event_loop::ControlFlow::Exit;
                    }
                    WindowEvent::Resized(size) => {
                        if let Ok(webview_guard) = webview.lock() {
                            if let Some(ref webview) = *webview_guard {
                                let script = format!("window.__VOKEX__.__emit('window.resized', {{width: {}, height: {}}})", size.width, size.height);
                                webview.evaluate_script(&script).unwrap_or(());
                            }
                        }
                    }
                    _ => {}
                }
            }
            tao::event::Event::MainEventsCleared => {
                #[cfg(target_os = "linux")]
                while gtk::events_pending() {
                    gtk::main_iteration_do(false);
                }
            }
            _ => {}
        }
    })
}

fn handle_ipc_message(webview: &WebView, message: wry::http::Request<String>) {
    let message_str = message.body();
    if let Ok(ipc_message) = serde_json::from_str::<IpcMessage>(message_str) {
        let result = api::handle_api_call(&ipc_message.method, &ipc_message.args);
        let (code, message, data) = match result {
            Ok(data) => (0, "".to_string(), data),
            Err(err) => (1, err.to_string(), Value::Null),
        };

        let script = format!(
            "window.__VOKEX__.__resolve('{}', {}, '{}', {})",
            ipc_message.id,
            code,
            message,
            serde_json::to_string(&data).unwrap_or("null".to_string())
        );

        webview.evaluate_script(&script).unwrap_or(());
    }
}
