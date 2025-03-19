use axum::{
    routing::{get, post},
    Router,
};
use dotenv::dotenv;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod db;
mod error;
mod middleware;
mod models;
mod routes;
mod services;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting thesaurus-api server");

    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    tracing::info!("Connected to database");

    sqlx::migrate!("./migrations").run(&pool).await?;

    tracing::info!("Migrations applied successfully");

    let meili_url = std::env::var("MEILI_URL").expect("MEILI_URL must be set");
    let meili_key = std::env::var("MEILI_MASTER_KEY").expect("MEILI_MASTER_KEY must be set");
    let meili_client = meilisearch_sdk::Client::new(meili_url, Some(meili_key));

    services::search::setup_meilisearch(&meili_client).await?;

    tracing::info!("Meilisearch configured successfully");

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        // Health check
        .route("/health", get(routes::health::health_check))
        // Auth routes
        .route("/auth/register", post(routes::auth::register))
        .route("/auth/login", post(routes::auth::login))
        .route("/auth/refresh", post(routes::auth::refresh_token))
        // Thesaurus routes
        .route("/api/search", get(routes::thesaurus::search))
        .route("/api/word/:word", get(routes::thesaurus::get_word))
        .route("/api/synonyms/:word", get(routes::thesaurus::get_synonyms))
        .route("/api/antonyms/:word", get(routes::thesaurus::get_antonyms))
        .route(
            "/api/broader/:word",
            get(routes::thesaurus::get_broader_terms),
        )
        .route(
            "/api/narrower/:word",
            get(routes::thesaurus::get_narrower_terms),
        )
        .route(
            "/api/related/:word",
            get(routes::thesaurus::get_related_terms),
        )
        .route(
            "/api/definition/:word",
            get(routes::thesaurus::get_definition),
        )
        .route("/api/examples/:word", get(routes::thesaurus::get_examples))
        .route("/api/all/:word", get(routes::thesaurus::get_all_relations))
        //middleware
        .layer(cors)
        .with_state(db::AppState {
            db: pool.clone(),
            meili: meili_client,
            config: config::Config::from_env(),
        });

    let port = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse::<u16>().ok())
        .unwrap_or(3000);

    let host = match std::env::var("HOST") {
        Ok(host_str) => {
            if host_str == "0.0.0.0" {
                std::net::IpAddr::V4(std::net::Ipv4Addr::new(0, 0, 0, 0))
            } else {
                host_str
                    .parse()
                    .unwrap_or_else(|_| std::net::IpAddr::V4(std::net::Ipv4Addr::new(0, 0, 0, 0)))
            }
        }
        Err(_) => std::net::IpAddr::V4(std::net::Ipv4Addr::new(0, 0, 0, 0)),
    };

    let addr = SocketAddr::from((host, port));
    tracing::info!("Listening on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}
