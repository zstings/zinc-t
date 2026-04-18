use std::sync::OnceLock;
use serde::Deserialize;

#[derive(Deserialize, Default, Clone, Debug)]
pub struct AppConfigSx {
    pub dev_mode: Option<bool>,
    pub identifier: Option<String>,
    pub name: String,
    pub version: Option<String>,
    pub window: AppConfigWindowSx,
}

#[derive(Deserialize, Default, Clone, Debug)]
pub struct AppConfigWindowSx {
    pub title: String,
    pub width: u32,
    pub height: u32,
}

// 1. 定义全局变量 (此时它是空的，还没初始化)
static GLOBAL_CONFIG: OnceLock<AppConfigSx> = OnceLock::new();

// 2. 初始化函数
pub fn init_app_config() {
    let json_str = r#"
    {
        "name": "My App11",
        "version": "1.0.0",
        "identifier": "com.example.app",
        "window": {
            "title": "My App",
            "width": 600,
            "height": 600
        }
    }
    "#;
    let config: AppConfigSx = serde_json::from_str(json_str).unwrap();
    GLOBAL_CONFIG.set(config).unwrap();
}

pub fn get_config() -> &'static AppConfigSx {
    GLOBAL_CONFIG.get().unwrap()
}
