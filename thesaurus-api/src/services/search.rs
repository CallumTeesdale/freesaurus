use crate::{
    error::AppError,
    models::word::{RelationType, SearchFilters, SearchResponse, Word},
};
use meilisearch_sdk::{client::Client as MeiliClient, search::{SearchResults, SearchQuery}};
use std::borrow::Cow;

pub async fn search_words(
    client: &MeiliClient,
    query: &str,
    offset: usize,
    limit: usize,
    filters: Option<SearchFilters>,
) -> Result<SearchResponse, AppError> {
    let index = client.index("words");

    // Create filter strings first so they live for the entire function
    let mut pos_filter = None;
    let mut exact_match_filter = None;

    // Prepare filter strings outside the query building
    if let Some(filters) = filters {
        if let Some(pos) = filters.pos {
            pos_filter = Some(format!("pos = \"{}\"", pos));
        }

        if let Some(true) = filters.exact_match {
            exact_match_filter = Some(format!("word = \"{}\"", query));
        }
    }

    // Build the query
    let mut search_query = index.search();
    search_query
        .with_query(query)
        .with_offset(offset)
        .with_limit(limit);

    // Apply filters that were prepared earlier
    if let Some(filter) = &pos_filter {
        search_query.with_filter(filter);
    }

    if let Some(filter) = &exact_match_filter {
        search_query.with_filter(filter);
    }

    // Execute search
    let search_results: SearchResults<Word> = search_query.execute().await?;

    // Convert SearchResult<Word> to Word
    let hits = search_results.hits.into_iter()
        .map(|result| result.result)
        .collect();

    Ok(SearchResponse {
        hits,
        offset,
        limit,
        total: search_results.estimated_total_hits.unwrap_or(0),
    })
}

pub async fn get_word_by_exact_match(
    client: &MeiliClient,
    word: &str,
) -> Result<Option<Word>, AppError> {
    let index = client.index("words");

    // Create filter string with long lifetime
    let filter_str = format!("word = \"{}\"", word);

    // Build and execute the query
    let mut search_query = index.search();
    search_query
        .with_query(word)
        .with_filter(&filter_str)
        .with_limit(1);

    let search_results: SearchResults<Word> = search_query.execute().await?;

    // Map Option<SearchResult<Word>> to Option<Word>
    Ok(search_results.hits.into_iter().next().map(|result| result.result))
}

pub async fn get_relations(
    client: &MeiliClient,
    word: &str,
    relation_type: RelationType,
) -> Result<Vec<String>, AppError> {
    let word_result = get_word_by_exact_match(client, word).await?;

    match word_result {
        Some(word_obj) => {
            match relation_type {
                RelationType::Synonym => Ok(word_obj.synonyms),
                RelationType::Antonym => Ok(word_obj.antonyms),
                RelationType::BroaderTerm => Ok(word_obj.broader_terms),
                RelationType::NarrowerTerm => Ok(word_obj.narrower_terms),
                RelationType::RelatedTerm => Ok(word_obj.related_terms),
            }
        },
        None => Ok(Vec::new()),
    }
}

pub async fn get_word_definition(
    client: &MeiliClient,
    word: &str,
) -> Result<Vec<String>, AppError> {
    let word_result = get_word_by_exact_match(client, word).await?;

    match word_result {
        Some(word_obj) => Ok(word_obj.definitions),
        None => Ok(Vec::new()),
    }
}

pub async fn get_word_examples(
    client: &MeiliClient,
    word: &str,
) -> Result<Vec<String>, AppError> {
    let word_result = get_word_by_exact_match(client, word).await?;

    match word_result {
        Some(word_obj) => Ok(word_obj.examples),
        None => Ok(Vec::new()),
    }
}

pub async fn get_all_word_relations(
    client: &MeiliClient,
    word: &str,
) -> Result<Word, AppError> {
    let word_result = get_word_by_exact_match(client, word).await?;

    match word_result {
        Some(word_obj) => Ok(word_obj),
        None => Err(AppError::NotFound(format!("Word '{}' not found", word))),
    }
}

pub async fn setup_meilisearch(client: &MeiliClient) -> Result<(), AppError> {
    // Create the words index if it doesn't exist
    let words_index = client.index("words");

    // Check if index exists by trying to get its stats
    let stats_result = words_index.get_stats().await;

    if stats_result.is_err() {
        // Create the index
        tracing::info!("Creating words index in Meilisearch");

        // Set up searchable attributes
        words_index
            .set_searchable_attributes(&["word", "definitions", "synonyms", "antonyms", "examples"])
            .await?;

        // Set up filterable attributes
        words_index
            .set_filterable_attributes(&["word", "pos"])
            .await?;

        // Set up sortable attributes
        words_index
            .set_sortable_attributes(&["word"])
            .await?;

        // Set up ranking rules
        words_index
            .set_ranking_rules(&[
                "words",
                "typo",
                "proximity",
                "attribute",
                "sort",
                "exactness",
            ])
            .await?;

        tracing::info!("Meilisearch index created and configured");
    } else {
        tracing::info!("Meilisearch index already exists");
    }

    Ok(())
}