use std::fs::File;
use std::io::{self, Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use flate2::read::ZlibDecoder;
use hostname::get;
use serde::Deserialize;
use serde_json::{json, Value};
use tao::event::{WindowEvent};
use tao::event_loop::{EventLoop};
use tao::window::{WindowBuilder};
use tao::dpi::LogicalSize;
use wry::http::{Response};
use wry::{WebView, WebViewBuilder};

const MAGIC: &[u8] = b"ZINC";
const MAGIC_SIZE: usize = 4;
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

        let mut compressed_data = Vec::new();
        file.read_to_end(&mut compressed_data)?;

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
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let mut dev_mode = false;
    let mut dev_dir = None;

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
            _ => {
                i += 1;
            }
        }
    }

    let event_loop = EventLoop::new();
    let window = WindowBuilder::new()
        .with_title("Zinc App")
        .with_inner_size(LogicalSize::new(800, 600))
        .build(&event_loop)
        .unwrap();

    let mut resources = None;
    if !dev_mode {
        if let Ok(exe_path) = std::env::current_exe() {
            if let Ok(res) = Resources::load_from_exe(&exe_path) {
                resources = Some(Arc::new(res));
            }
        }
    }

    let init_script = r#"
    window.__ZINC__ = {
        __callbacks: {},
        __nextId: 0,
        call: function(method, args) {
            return new Promise((resolve, reject) => {
                const id = String(this.__nextId++);
                this.__callbacks[id] = { resolve, reject };
                window.__ZINC_IPC__.postMessage(JSON.stringify({
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
                    console.error('Error in event listener:', e);
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

    let webview = WebViewBuilder::new()
        .with_initialization_script(init_script)
        .with_url("zinc://index.html")
        .with_custom_protocol("zinc".to_string(), move |request, _| {
            let path = request.trim_start_matches("zinc://").trim_start_matches('/');
            let path = if path.is_empty() { "index.html" } else { path };

            if dev_mode {
                if let Some(ref dev_dir) = dev_dir {
                    let file_path = dev_dir.join(path);
                    if let Ok(mut file) = File::open(file_path) {
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
            } else if let Some(ref resources) = resources {
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
        .unwrap();

    *webview_arc.lock().unwrap() = Some(webview);
    let webview = webview_arc;
    let _window = Some(window);

    event_loop.run(move |event, _, control_flow| {
        *control_flow = tao::event_loop::ControlFlow::Wait;

        match event {
            tao::event::Event::WindowEvent { event, .. } => {
                match event {
                    WindowEvent::CloseRequested => {
                        if let Ok(webview_guard) = webview.lock() {
                            if let Some(ref webview) = *webview_guard {
                                webview.evaluate_script("window.__ZINC__.__emit('window.closed', {})").unwrap_or(());
                            }
                        }
                        *control_flow = tao::event_loop::ControlFlow::Exit;
                    }
                    WindowEvent::Resized(size) => {
                        if let Ok(webview_guard) = webview.lock() {
                            if let Some(ref webview) = *webview_guard {
                                let script = format!("window.__ZINC__.__emit('window.resized', {{width: {}, height: {}}})", size.width, size.height);
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
        let result = handle_api_call(&ipc_message.method, &ipc_message.args);
        let (code, message, data) = match result {
            Ok(data) => (0, "".to_string(), data),
            Err(err) => (1, err.to_string(), Value::Null),
        };

        let script = format!(
            "window.__ZINC__.__resolve('{}', {}, '{}', {})",
            ipc_message.id,
            code,
            message,
            serde_json::to_string(&data).unwrap_or("null".to_string())
        );

        webview.evaluate_script(&script).unwrap_or(());
    }
}

fn handle_api_call(method: &str, args: &Value) -> Result<Value, String> {
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
        _ => Err(format!("Unknown namespace: {}", namespace)),
    }
}

fn handle_window_api(_method: &str, _args: &Value) -> Result<Value, String> {
    // TODO: Implement window API
    Ok(Value::Null)
}

fn handle_fs_api(_method: &str, _args: &Value) -> Result<Value, String> {
    // TODO: Implement fs API
    Ok(Value::Null)
}

fn handle_app_api(method: &str, _args: &Value) -> Result<Value, String> {
    match method {
        "getConfig" => Ok(json!({})),
        "version" => Ok(json!("1.0.0")),
        _ => Err(format!("Unknown app method: {}", method)),
    }
}

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
            if let Ok(hostname) = get() {
                Ok(json!(hostname))
            } else {
                Ok(json!(""))
            }
        }
        _ => Err(format!("Unknown os method: {}", method)),
    }
}

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

fn handle_dialog_api(_method: &str, _args: &Value) -> Result<Value, String> {
    // TODO: Implement dialog API
    Ok(Value::Null)
}

fn handle_clipboard_api(_method: &str, _args: &Value) -> Result<Value, String> {
    // TODO: Implement clipboard API
    Ok(Value::Null)
}
