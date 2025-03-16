use crate::{
    db::AppState,
    error::AppError,
    models::word::{RelationType, SearchFilters},
    services::search::{
        get_all_word_relations, get_relations, get_word_by_exact_match,
        get_word_definition, get_word_examples, search_words
    },
};
use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    q: String,
    #[serde(default = "default_offset")]
    offset: usize,
    #[serde(default = "default_limit")]
    limit: usize,
    pos: Option<String>,
    exact_match: Option<bool>,
}

fn default_offset() -> usize {
    0
}

fn default_limit() -> usize {
    20
}

pub async fn search(
    State(state): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let filters = SearchFilters {
        pos: query.pos,
        exact_match: query.exact_match,
    };

    let search_results = search_words(
        &state.meili,
        &query.q,
        query.offset,
        query.limit,
        Some(filters)
    ).await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "results": search_results,
    })))
}

pub async fn get_word(
    State(state): State<AppState>,
    Path(word): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let word_result = get_word_by_exact_match(&state.meili, &word).await?;

    match word_result {
        Some(word_obj) => Ok(Json(serde_json::json!({
            "status": "success",
            "word": word_obj,
        }))),
        None => Err(AppError::NotFound(format!("Word '{}' not found", word))),
    }
}

pub async fn get_synonyms(
    State(state): State<AppState>,
    Path(word): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let synonyms = get_relations(&state.meili, &word, RelationType::Synonym).await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "word": word,
        "relation": RelationType::Synonym.display_name(),
        "related_words": synonyms,
    })))
}

pub async fn get_antonyms(
    State(state): State<AppState>,
    Path(word): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let antonyms = get_relations(&state.meili, &word, RelationType::Antonym).await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "word": word,
        "relation": RelationType::Antonym.display_name(),
        "related_words": antonyms,
    })))
}

pub async fn get_broader_terms(
    State(state): State<AppState>,
    Path(word): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let hypernyms = get_relations(&state.meili, &word, RelationType::BroaderTerm).await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "word": word,
        "relation": RelationType::BroaderTerm.display_name(),
        "related_words": hypernyms,
    })))
}

pub async fn get_narrower_terms(
    State(state): State<AppState>,
    Path(word): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let hyponyms = get_relations(&state.meili, &word, RelationType::NarrowerTerm).await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "word": word,
        "relation": RelationType::NarrowerTerm.display_name(),
        "related_words": hyponyms,
    })))
}

pub async fn get_related_terms(
    State(state): State<AppState>,
    Path(word): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let related = get_relations(&state.meili, &word, RelationType::RelatedTerm).await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "word": word,
        "relation": RelationType::RelatedTerm.display_name(),
        "related_words": related,
    })))
}

pub async fn get_definition(
    State(state): State<AppState>,
    Path(word): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let definitions = get_word_definition(&state.meili, &word).await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "word": word,
        "definitions": definitions,
    })))
}

pub async fn get_examples(
    State(state): State<AppState>,
    Path(word): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let examples = get_word_examples(&state.meili, &word).await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "word": word,
        "examples": examples,
    })))
}

pub async fn get_all_relations(
    State(state): State<AppState>,
    Path(word): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let word_data = get_all_word_relations(&state.meili, &word).await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "word": word_data,
    })))
}