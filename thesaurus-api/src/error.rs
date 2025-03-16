use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Authentication error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("Bcrypt error: {0}")]
    Bcrypt(#[from] bcrypt::BcryptError),

    #[error("Meilisearch error: {0}")]
    Meilisearch(#[from] meilisearch_sdk::errors::Error),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("User already exists")]
    UserAlreadyExists,

    #[error("Invalid credentials")]
    InvalidCredentials,

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal server error: {0}")]
    InternalServerError(String),

    #[error("Validation error: {0}")]
    ValidationError(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Database(ref e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            AppError::Jwt(ref e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            AppError::Bcrypt(ref e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            AppError::Meilisearch(ref e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".to_string()),
            AppError::UserAlreadyExists => (StatusCode::CONFLICT, "User already exists".to_string()),
            AppError::InvalidCredentials => (StatusCode::BAD_REQUEST, "Invalid credentials".to_string()),
            AppError::NotFound(ref e) => (StatusCode::NOT_FOUND, e.to_string()),
            AppError::BadRequest(ref e) => (StatusCode::BAD_REQUEST, e.to_string()),
            AppError::InternalServerError(ref e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            AppError::ValidationError(ref e) => (StatusCode::BAD_REQUEST, e.to_string()),
        };

        tracing::error!("API Error: {:?}", self);

        let body = Json(json!({
            "status": "error",
            "message": error_message,
        }));

        (status, body).into_response()
    }
}