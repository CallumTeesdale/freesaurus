// db/postgres.rs
use sqlx::postgres::PgPool;
use meilisearch_sdk::client::Client as MeiliClient;
use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub meili: MeiliClient,
    pub config: Config,
}