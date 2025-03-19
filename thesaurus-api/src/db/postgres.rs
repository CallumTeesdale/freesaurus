use crate::config::Config;
use meilisearch_sdk::client::Client as MeiliClient;
use sqlx::postgres::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub meili: MeiliClient,
    pub config: Config,
}
