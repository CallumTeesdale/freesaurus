use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Word {
    pub id: String,
    pub word: String,
    pub definitions: Vec<String>,
    pub pos: Vec<String>, // Parts of speech
    pub synonyms: Vec<String>,
    pub antonyms: Vec<String>,
    pub broader_terms: Vec<String>,  // Hypernyms
    pub narrower_terms: Vec<String>, // Hyponyms
    pub related_terms: Vec<String>,  // Other relations
    pub examples: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResponse {
    pub hits: Vec<Word>,
    pub offset: usize,
    pub limit: usize,
    pub total: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchFilters {
    pub pos: Option<String>,
    pub exact_match: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RelationResponse {
    pub word: String,
    pub relation: String,
    pub related_words: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone, Copy)]
pub enum RelationType {
    Synonym,
    Antonym,
    BroaderTerm,
    NarrowerTerm,
    RelatedTerm,
}

impl RelationType {
    pub fn as_str(&self) -> &'static str {
        match self {
            RelationType::Synonym => "synonyms",
            RelationType::Antonym => "antonyms",
            RelationType::BroaderTerm => "broader_terms",
            RelationType::NarrowerTerm => "narrower_terms",
            RelationType::RelatedTerm => "related_terms",
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            RelationType::Synonym => "Synonyms",
            RelationType::Antonym => "Antonyms",
            RelationType::BroaderTerm => "Broader Terms",
            RelationType::NarrowerTerm => "Narrower Terms",
            RelationType::RelatedTerm => "Related Terms",
        }
    }
}
