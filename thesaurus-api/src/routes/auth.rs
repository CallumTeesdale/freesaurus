use crate::{
    db::AppState,
    error::AppError,
    models::user::{LoginUserSchema, RegisterUserSchema, UserResponse},
    services::auth::{create_user, generate_token, login_user, verify_token},
};
use axum::{
    extract::State,
    http::{header, HeaderMap},
    response::IntoResponse,
    Json,
};
use serde_json::json;
use validator::Validate;

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterUserSchema>,
) -> Result<impl IntoResponse, AppError> {
    // Validate input
    payload.validate().map_err(|e| AppError::ValidationError(e.to_string()))?;

    // Create user in database
    let user = create_user(&state.db, &payload.name, &payload.email, &payload.password).await?;

    // Generate JWT token
    let token = generate_token(&state.config, &user.id)?;

    // Set cookie with token
    let mut headers = HeaderMap::new();
    headers.insert(
        header::SET_COOKIE,
        format!(
            "token={}; Max-Age={}; Path=/; HttpOnly; SameSite=Strict",
            token, state.config.jwt_maxage * 60
        )
            .parse()
            .unwrap(),
    );

    Ok((
        headers,
        Json(json!({
            "status": "success",
            "token": token,
            "user": UserResponse::from(user)
        })),
    ))
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginUserSchema>,
) -> Result<impl IntoResponse, AppError> {
    // Validate input
    payload.validate().map_err(|e| AppError::ValidationError(e.to_string()))?;

    // Authenticate user
    let user = login_user(&state.db, &payload.email, &payload.password).await?;

    // Generate JWT token
    let token = generate_token(&state.config, &user.id)?;

    // Set cookie with token
    let mut headers = HeaderMap::new();
    headers.insert(
        header::SET_COOKIE,
        format!(
            "token={}; Max-Age={}; Path=/; HttpOnly; SameSite=Strict",
            token, state.config.jwt_maxage * 60
        )
            .parse()
            .unwrap(),
    );

    Ok((
        headers,
        Json(json!({
            "status": "success",
            "token": token,
            "user": UserResponse::from(user)
        })),
    ))
}

pub async fn refresh_token(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    // Get token from Authorization header
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|auth_header| auth_header.to_str().ok())
        .and_then(|auth_value| {
            if auth_value.starts_with("Bearer ") {
                Some(auth_value[7..].to_owned())
            } else {
                None
            }
        })
        .ok_or(AppError::Unauthorized)?;

    // Verify the token
    let claims = verify_token(&state.config, &token)?;
    let user_id = uuid::Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;

    // Generate a new token
    let new_token = generate_token(&state.config, &user_id)?;

    // Set new cookie with token
    let mut response_headers = HeaderMap::new();
    response_headers.insert(
        header::SET_COOKIE,
        format!(
            "token={}; Max-Age={}; Path=/; HttpOnly; SameSite=Strict",
            new_token, state.config.jwt_maxage * 60
        )
            .parse()
            .unwrap(),
    );

    Ok((
        response_headers,
        Json(json!({
            "status": "success",
            "token": new_token
        })),
    ))
}