use crate::{
    db::AppState,
    error::AppError,
    models::user::{User},
    services::auth::verify_token,
};
use axum::{
    body::Body,
    extract::State,
    http::Request,
    middleware::Next,
    response::Response,
};
use uuid::Uuid;

pub async fn auth(
    State(state): State<AppState>,
    mut req: Request<Body>,
    next: Next<Body>,
) -> Result<Response, AppError> {
    // Get token from headers
    let token = req
        .headers()
        .get("Authorization")
        .and_then(|auth_header| auth_header.to_str().ok())
        .and_then(|auth_value| {
            if auth_value.starts_with("Bearer ") {
                Some(auth_value[7..].to_owned())
            } else {
                None
            }
        });

    let token = token.ok_or(AppError::Unauthorized)?;

    // Verify token
    let claims = verify_token(&state.config, &token)?;

    // Get user from database
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::Unauthorized)?;

    // Add user to request extensions
    req.extensions_mut().insert(user);

    // Continue with the request
    Ok(next.run(req).await)
}