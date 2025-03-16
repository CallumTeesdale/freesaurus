use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub jwt_secret: String,
    pub jwt_expires_in: u64,
    pub jwt_maxage: i64,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            jwt_secret: std::env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
            jwt_expires_in: std::env::var("JWT_EXPIRES_IN")
                .unwrap_or_else(|_| "60".to_string())
                .parse::<u64>()
                .expect("JWT_EXPIRES_IN must be a number"),
            jwt_maxage: std::env::var("JWT_MAXAGE")
                .unwrap_or_else(|_| "60".to_string())
                .parse::<i64>()
                .expect("JWT_MAXAGE must be a number"),
        }
    }
}