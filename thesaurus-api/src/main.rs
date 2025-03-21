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

    let state = db::AppState {
        db: pool.clone(),
        meili: meili_client,
        config: config::Config::from_env(),
    };

    let auth_routes = Router::new()
        .route("/register", post(routes::auth::register))
        .route("/login", post(routes::auth::login))
        .route("/refresh", post(routes::auth::refresh_token))
        .with_state(state.clone());

    let api_routes = Router::new()
        .route("/search", get(routes::thesaurus::search))
        .route("/word/:word", get(routes::thesaurus::get_word))
        .route("/synonyms/:word", get(routes::thesaurus::get_synonyms))
        .route("/antonyms/:word", get(routes::thesaurus::get_antonyms))
        .route("/broader/:word", get(routes::thesaurus::get_broader_terms))
        .route(
            "/narrower/:word",
            get(routes::thesaurus::get_narrower_terms),
        )
        .route("/related/:word", get(routes::thesaurus::get_related_terms))
        .route("/definition/:word", get(routes::thesaurus::get_definition))
        .route("/examples/:word", get(routes::thesaurus::get_examples))
        .route("/all/:word", get(routes::thesaurus::get_all_relations))
        .nest(
            "/favorites",
            routes::favorites::favorites_router(state.clone()),
        )
        .nest(
            "/activities",
            routes::activities::activities_router(state.clone()),
        )
        .with_state(state.clone());

    let app = Router::new()
        .route("/health", get(routes::health::health_check))
        .nest("/auth", auth_routes)
        .nest("/api", api_routes)
        .layer(cors)
        .with_state(state);

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
