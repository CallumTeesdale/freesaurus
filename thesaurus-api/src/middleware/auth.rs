use crate::{db::AppState, error::AppError, models::user::User, services::auth::verify_token};
use axum::{body::Body, extract::State, http::Request, middleware::Next, response::Response};
use uuid::Uuid;

pub async fn auth(
    State(state): State<AppState>,
    mut req: Request<Body>,
    next: Next<Body>,
) -> Result<Response, AppError> {
    let token = req
        .headers()
        .get("Authorization")
        .and_then(|auth_header| auth_header.to_str().ok())
        .and_then(|auth_value| {
            auth_value
                .strip_prefix("Bearer ")
                .map(|token| token.to_string())
        });

    let token = token.ok_or(AppError::Unauthorized)?;

    let claims = verify_token(&state.config, &token)?;

    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::Unauthorized)?;

    req.extensions_mut().insert(user);

    Ok(next.run(req).await)
}
