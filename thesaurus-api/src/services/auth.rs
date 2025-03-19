use crate::{
    config::Config,
    error::AppError,
    models::user::{TokenClaims, User},
};
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn create_user(
    pool: &PgPool,
    name: &str,
    email: &str,
    password: &str,
) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(email)
        .fetch_optional(pool)
        .await?;

    if user.is_some() {
        return Err(AppError::UserAlreadyExists);
    }

    let hashed_password = hash(password, DEFAULT_COST)?;

    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
    )
    .bind(Uuid::new_v4())
    .bind(name)
    .bind(email)
    .bind(hashed_password)
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn login_user(pool: &PgPool, email: &str, password: &str) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(email)
        .fetch_optional(pool)
        .await?;

    let user = user.ok_or(AppError::InvalidCredentials)?;

    let is_valid = verify(password, &user.password)?;
    if !is_valid {
        return Err(AppError::InvalidCredentials);
    }

    Ok(user)
}

pub fn generate_token(config: &Config, user_id: &Uuid) -> Result<String, AppError> {
    let now = chrono::Utc::now();
    let iat = now.timestamp() as usize;
    let exp = (now + chrono::Duration::minutes(config.jwt_maxage)).timestamp() as usize;
    let claims = TokenClaims {
        sub: user_id.to_string(),
        iat,
        exp,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.jwt_secret.as_bytes()),
    )?;

    Ok(token)
}

pub fn verify_token(config: &Config, token: &str) -> Result<TokenClaims, AppError> {
    let claims = decode::<TokenClaims>(
        token,
        &DecodingKey::from_secret(config.jwt_secret.as_bytes()),
        &Validation::default(),
    )?;

    Ok(claims.claims)
}
