use std::env;

pub fn get_args(name: &str) -> Option<String> {
    let args: Vec<String> = env::args().collect();
    let mut i = 1;
    while i < args.len() {
        if args[i] == name {
            if i + 1 < args.len() && !args[i + 1].starts_with('-') {
                return Some(args[i + 1].clone());
            }
            return Some(String::new());
        }
        i += 1;
    }
    None
}

pub fn has_flag(name: &str) -> bool {
    let args: Vec<String> = env::args().collect();
    args.iter().any(|arg| arg == name)
}
