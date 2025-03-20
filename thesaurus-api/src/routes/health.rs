use crate::db::AppState;
use axum::extract::State;
use axum::{http::StatusCode, Json};
use serde_json::json;

pub async fn health_check(State(state): State<AppState>) -> (StatusCode, Json<serde_json::Value>) {
    let meili_status = if state.meili.health().await.is_ok() {
        "ok"
    } else {
        tracing::error!("Meili health check failed");
        "error"
    };

    let postgres_status = if sqlx::query("SELECT 1").fetch_one(&state.db).await.is_ok() {
        "ok"
    } else {
        tracing::error!("Postgres health check failed");
        "error"
    };

    let overall_status = if meili_status == "ok" && postgres_status == "ok" {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };

    (
        overall_status,
        Json(json!({
            "status": if overall_status == StatusCode::OK { "success" } else { "error" },
            "services": {
                "meili": meili_status,
                "postgres": postgres_status,
            }
        })),
    )
}
