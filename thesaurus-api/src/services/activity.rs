use crate::error::AppError;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ActivityType {
    Search,
    ViewWord,
    AddFavorite,
    RemoveFavorite,
    Login,
    Logout,
    Register,
}

impl ActivityType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ActivityType::Search => "search",
            ActivityType::ViewWord => "view_word",
            ActivityType::AddFavorite => "add_favorite",
            ActivityType::RemoveFavorite => "remove_favorite",
            ActivityType::Login => "login",
            ActivityType::Logout => "logout",
            ActivityType::Register => "register",
        }
    }
}

pub async fn track_activity(
    pool: &PgPool,
    user_id: &Uuid,
    activity_type: ActivityType,
    word: Option<&str>,
    details: Option<Value>,
) -> Result<(), AppError> {
    sqlx::query!(
        r#"
        INSERT INTO user_activities (user_id, activity_type, word, details)
        VALUES ($1, $2, $3, $4)
        "#,
        user_id,
        activity_type.as_str(),
        word,
        details
    )
    .execute(pool)
    .await?;

    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserActivity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub activity_type: String,
    pub word: Option<String>,
    pub details: Option<Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn get_user_activities(
    pool: &PgPool,
    user_id: &Uuid,
    limit: i64,
    offset: i64,
) -> Result<Vec<UserActivity>, AppError> {
    let activities = sqlx::query_as!(
        UserActivity,
        r#"
        SELECT id, user_id, activity_type, word, details, created_at
        FROM user_activities
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        "#,
        user_id,
        limit,
        offset
    )
    .fetch_all(pool)
    .await?;

    Ok(activities)
}

pub async fn get_recent_viewed_words(
    pool: &PgPool,
    user_id: &Uuid,
    limit: i64,
) -> Result<Vec<String>, AppError> {
    let viewed_words = sqlx::query!(
        r#"
        SELECT word, MAX(created_at) as last_viewed
        FROM user_activities
        WHERE user_id = $1 AND activity_type = 'view_word' AND word IS NOT NULL
        GROUP BY word
        ORDER BY last_viewed DESC
        LIMIT $2
        "#,
        user_id,
        limit
    )
    .fetch_all(pool)
    .await?;

    Ok(viewed_words
        .into_iter()
        .filter_map(|row| row.word)
        .collect())
}
