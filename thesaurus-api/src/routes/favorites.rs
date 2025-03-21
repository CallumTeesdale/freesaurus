use crate::{
    db::AppState, error::AppError, middleware::auth::auth, models::user::User, models::word::Word,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    middleware,
    routing::{delete, get, post},
    Extension, Json, Router,
};
use axum_macros::debug_handler;
use meilisearch_sdk::search::SearchResults;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize)]
struct FavoriteResponse {
    id: Uuid,
    word: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct AddFavoriteRequest {
    word: String,
}

pub fn favorites_router(state: AppState) -> Router {
    Router::new()
        .route("/", get(get_favorites))
        .route("/", post(add_favorite))
        .route("/:word", delete(remove_favorite))
        .layer(middleware::from_fn_with_state(state.clone(), auth))
}

#[debug_handler]
async fn get_favorites(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
) -> Result<Json<Vec<FavoriteResponse>>, AppError> {
    let favorites = sqlx::query_as!(
        FavoriteResponse,
        r#"
        SELECT id, word, created_at
        FROM user_favorites
        WHERE user_id = $1
        ORDER BY created_at DESC
        "#,
        user.id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(favorites))
}

async fn add_favorite(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Json(payload): Json<AddFavoriteRequest>,
) -> Result<StatusCode, AppError> {
    let word = payload.word.trim().to_lowercase();

    if word.is_empty() {
        return Err(AppError::BadRequest("Word cannot be empty".to_string()));
    }

    // Check if word exists in Meilisearch first
    let index = state.meili.index("words");
    let filter = format!("word = \"{}\"", word);

    let mut search = index.search();
    search.with_query(&word).with_filter(&filter).with_limit(1);

    let search_result: SearchResults<Word> = search.execute().await?;
    if search_result.hits.is_empty() {
        return Err(AppError::NotFound(format!(
            "Word '{}' not found in dictionary",
            word
        )));
    }

    // Insert or ignore if already exists
    sqlx::query!(
        r#"
        INSERT INTO user_favorites (user_id, word)
        VALUES ($1, $2)
        ON CONFLICT (user_id, word) DO NOTHING
        "#,
        user.id,
        word
    )
    .execute(&state.db)
    .await?;

    Ok(StatusCode::CREATED)
}

async fn remove_favorite(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(word): Path<String>,
) -> Result<StatusCode, AppError> {
    let word = word.trim().to_lowercase();

    let result = sqlx::query!(
        r#"
        DELETE FROM user_favorites
        WHERE user_id = $1 AND word = $2
        "#,
        user.id,
        word
    )
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Favorite '{}' not found", word)));
    }

    Ok(StatusCode::NO_CONTENT)
}
