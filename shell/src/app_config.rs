use std::sync::OnceLock;
use serde::Deserialize;
use crate::args_utils::{get_args, has_flag};
use crate::Resources;

#[derive(Deserialize, Default, Clone, Debug)]
pub struct AppConfigSx {
    pub dev_mode: bool,
    pub identifier: String,
    pub name: String,
    pub version: String,
    pub window: AppConfigWindowSx,
}

#[derive(Deserialize, Default, Clone, Debug)]
pub struct AppConfigWindowSx {
    pub title: String,
    pub width: u32,
    pub height: u32,
}

static GLOBAL_CONFIG: OnceLock<AppConfigSx> = OnceLock::new();

pub fn init_app_config() {
    let is_dev = has_flag("--dev") || get_args("--dev-url").is_some();
    
    let config = if is_dev {
        load_dev_config()
    } else {
        load_prod_config()
    };
    
    GLOBAL_CONFIG.set(config).expect("Failed to initialize app config");
}

fn load_dev_config() -> AppConfigSx {
    let config_json = get_args("--app-config")
        .expect("--app-config is required in dev mode");
    
    serde_json::from_str(&config_json)
        .expect("Failed to parse --app-config JSON")
}

fn load_prod_config() -> AppConfigSx {
    let exe_path = std::env::current_exe()
        .expect("Failed to get current exe path");
    
    let resources = Resources::load_from_exe(&exe_path)
        .expect("Failed to load resources from exe");
    
    let config_bytes = resources.get(".zinc-cli-data.json")
        .expect(".zinc-cli-data.json not found in resources");
    
    let config_json = String::from_utf8(config_bytes.to_vec())
        .expect(".zinc-cli-data.json is not valid UTF-8");
    
    serde_json::from_str(&config_json)
        .expect("Failed to parse zinc-cli-data.json")
}

pub fn get_config() -> &'static AppConfigSx {
    GLOBAL_CONFIG.get().expect("App config not initialized")
}
