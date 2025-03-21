use crate::{
    db::AppState,
    error::AppError,
    middleware::auth::auth,
    models::user::User,
    services::activity::{
        get_recent_viewed_words, get_user_activities, track_activity, ActivityType,
    },
};
use axum::{
    extract::{Query, State},
    middleware,
    routing::get,
    Extension, Json, Router,
};
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct ActivityQueryParams {
    #[serde(default = "default_limit")]
    limit: i64,
    #[serde(default = "default_offset")]
    offset: i64,
}

fn default_limit() -> i64 {
    50
}

fn default_offset() -> i64 {
    0
}

pub fn activities_router(state: AppState) -> Router<AppState> {
    Router::new()
        .route("/", get(get_activities))
        .route("/recent-words", get(recent_viewed_words))
        .layer(middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state)
}

async fn get_activities(
    state: State<AppState>,
    user: Extension<User>,
    params: Query<ActivityQueryParams>,
) -> Result<Json<serde_json::Value>, AppError> {
    let activities = get_user_activities(&state.db, &user.id, params.limit, params.offset).await?;

    Ok(Json(json!({
        "status": "success",
        "data": activities,
        "pagination": {
            "limit": params.limit,
            "offset": params.offset,
            "total_count": activities.len()
        }
    })))
}

async fn recent_viewed_words(
    state: State<AppState>,
    user: Extension<User>,
    params: Query<ActivityQueryParams>,
) -> Result<Json<serde_json::Value>, AppError> {
    let words = get_recent_viewed_words(&state.db, &user.id, params.limit).await?;

    Ok(Json(json!({
        "status": "success",
        "data": words
    })))
}

pub async fn track_word_view(pool: &PgPool, user_id: &Uuid, word: &str) -> Result<(), AppError> {
    track_activity(pool, user_id, ActivityType::ViewWord, Some(word), None).await
}

pub async fn track_search(pool: &PgPool, user_id: &Uuid, query: &str) -> Result<(), AppError> {
    track_activity(
        pool,
        user_id,
        ActivityType::Search,
        None,
        Some(json!({ "query": query })),
    )
    .await
}
