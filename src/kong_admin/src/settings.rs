use serde::{Deserialize, Serialize};
use std::fs::File;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Database {
    pub host: String,
    pub user: String,
    pub password: String,
    pub db_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub dfx_pem_file: String,
    pub database: Database,
    pub last_update_id: u64,
}

pub fn read_settings() -> Result<Settings, Box<dyn std::error::Error>> {
    let file = File::open("./settings.json")?;
    let reader = std::io::BufReader::new(file);
    let settings: Settings = serde_json::from_reader(reader)?;
    Ok(settings)
}

pub fn write_settings(settings: &Settings) -> Result<(), Box<dyn std::error::Error>> {
    let file = File::create("./settings.json")?;
    serde_json::to_writer_pretty(file, settings)?;
    Ok(())
}