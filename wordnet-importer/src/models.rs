use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct WordNetData {
    pub synsets: HashMap<String, Synset>,
    pub lexical_entries: HashMap<String, LexicalEntry>,
    pub senses: HashMap<String, Sense>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct LexicalEntry {
    pub id: String,
    pub lemma: Lemma,
    pub senses: Vec<String>, // Sense IDs
}

#[derive(Debug, Deserialize, Clone)]
pub struct Lemma {
    pub written_form: String,
    pub part_of_speech: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Sense {
    pub id: String,
    pub synset_id: String,
    pub relations: Vec<SenseRelation>,
    pub examples: Vec<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SenseRelation {
    pub rel_type: String,
    pub target: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Synset {
    pub id: String,
    pub ili: Option<String>,
    pub part_of_speech: String,
    pub definition: Option<String>,
    pub examples: Vec<String>,
    pub relations: Vec<SynsetRelation>,
    pub members: Vec<String>, // Sense IDs
}

#[derive(Debug, Deserialize, Clone)]
pub struct SynsetRelation {
    pub rel_type: String,
    pub target: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct MeiliWord {
    pub id: String,
    pub word: String,
    pub definitions: Vec<String>,
    pub pos: Vec<String>,
    pub synonyms: Vec<String>,
    pub antonyms: Vec<String>,
    pub broader_terms: Vec<String>,
    pub narrower_terms: Vec<String>,
    pub related_terms: Vec<String>,
    pub examples: Vec<String>,
}
