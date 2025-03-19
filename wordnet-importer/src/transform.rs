use rayon::prelude::*;
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use std::time::Instant;

use crate::models::{MeiliWord, WordNetData};

pub fn transform_to_meilisearch(data: &WordNetData) -> Vec<MeiliWord> {
    let start_time = Instant::now();
    println!("Starting WordNet transformation for Meilisearch...");
    println!(
        "Source data: {} synsets, {} lexical entries, {} senses",
        data.synsets.len(),
        data.lexical_entries.len(),
        data.senses.len()
    );

    let mut synset_relation_count = 0;
    let mut sense_relation_count = 0;
    let mut synset_relation_types = HashMap::new();
    let mut sense_relation_types = HashMap::new();

    for synset in data.synsets.values() {
        synset_relation_count += synset.relations.len();
        for relation in &synset.relations {
            *synset_relation_types
                .entry(relation.rel_type.clone())
                .or_insert(0) += 1;
        }
    }

    for sense in data.senses.values() {
        sense_relation_count += sense.relations.len();
        for relation in &sense.relations {
            *sense_relation_types
                .entry(relation.rel_type.clone())
                .or_insert(0) += 1;
        }
    }

    println!(
        "Found {} relations ({} synset, {} sense)",
        synset_relation_count + sense_relation_count,
        synset_relation_count,
        sense_relation_count
    );

    println!(
        "Found {} unique synset relation types, {} unique sense relation types",
        synset_relation_types.len(),
        sense_relation_types.len()
    );

    if !synset_relation_types.is_empty() {
        println!("Top synset relation types:");
        let mut types: Vec<_> = synset_relation_types.iter().collect();
        types.sort_by(|a, b| b.1.cmp(a.1));
        for (rel_type, count) in types.iter().take(5) {
            println!("  {}: {} occurrences", rel_type, count);
        }
    } else {
        println!("No synset relation types found!");
    }

    if !sense_relation_types.is_empty() {
        println!("Top sense relation types:");
        let mut types: Vec<_> = sense_relation_types.iter().collect();
        types.sort_by(|a, b| b.1.cmp(a.1));
        for (rel_type, count) in types.iter().take(5) {
            println!("  {}: {} occurrences", rel_type, count);
        }
    } else {
        println!("No sense relation types found!");
    }

    println!("Building sense to lemma mapping...");
    let mut sense_to_lemma: HashMap<String, String> = HashMap::new();

    for (le_id, le) in &data.lexical_entries {
        if le.lemma.written_form.trim().is_empty() {
            continue;
        }

        for sense_id in &le.senses {
            sense_to_lemma.insert(sense_id.clone(), le.lemma.written_form.clone());
        }
    }

    println!("Created mapping for {} senses", sense_to_lemma.len());

    println!("Building synset to lemmas mapping...");
    let mut synset_to_lemmas: HashMap<String, Vec<String>> = HashMap::new();

    for (sense_id, sense) in &data.senses {
        if let Some(lemma) = sense_to_lemma.get(sense_id) {
            if !lemma.trim().is_empty() {
                synset_to_lemmas
                    .entry(sense.synset_id.clone())
                    .or_default()
                    .push(lemma.clone());
            }
        }
    }

    for (synset_id, synset) in &data.synsets {
        for member_id in &synset.members {
            if let Some(lemma) = sense_to_lemma.get(member_id) {
                if !lemma.trim().is_empty() {
                    synset_to_lemmas
                        .entry(synset_id.clone())
                        .or_default()
                        .push(lemma.clone());
                }
            }
        }
    }

    for lemmas in synset_to_lemmas.values_mut() {
        lemmas.sort();
        lemmas.dedup();
    }

    println!(
        "Created synset to lemmas mapping for {} synsets",
        synset_to_lemmas.len()
    );

    println!("Building lemma to synsets mapping...");
    let mut lemma_to_synsets: HashMap<String, HashSet<String>> = HashMap::new();

    for (le_id, le) in &data.lexical_entries {
        let lemma = le.lemma.written_form.clone();

        if lemma.trim().is_empty() || lemma.len() > 100 || !is_valid_lemma(&lemma) {
            continue;
        }

        for sense_id in &le.senses {
            if let Some(sense) = data.senses.get(sense_id) {
                lemma_to_synsets
                    .entry(lemma.clone())
                    .or_default()
                    .insert(sense.synset_id.clone());
            }
        }
    }

    for (synset_id, lemmas) in &synset_to_lemmas {
        for lemma in lemmas {
            lemma_to_synsets
                .entry(lemma.clone())
                .or_default()
                .insert(synset_id.clone());
        }
    }

    println!(
        "Created lemma to synsets mapping for {} unique lemmas",
        lemma_to_synsets.len()
    );

    println!("Creating basic word entries...");
    let mut words: HashMap<String, MeiliWord> = HashMap::new();

    for lemma in lemma_to_synsets.keys() {
        let word_id = format!("word_{}", normalize_id(lemma));

        words.insert(
            word_id.clone(),
            MeiliWord {
                id: word_id,
                word: lemma.clone(),
                definitions: Vec::new(),
                pos: Vec::new(),
                synonyms: Vec::new(),
                antonyms: Vec::new(),
                broader_terms: Vec::new(),
                narrower_terms: Vec::new(),
                related_terms: Vec::new(),
                examples: Vec::new(),
            },
        );
    }

    println!("Created {} basic word entries", words.len());

    println!("Processing words with relationships (using parallel processing)...");
    let total_words = lemma_to_synsets.len();

    let data_synsets = Arc::new(data.synsets.clone());
    let data_senses = Arc::new(data.senses.clone());
    let data_lexical_entries = Arc::new(data.lexical_entries.clone());
    let sense_to_lemma = Arc::new(sense_to_lemma);
    let synset_to_lemmas = Arc::new(synset_to_lemmas);

    let counter = Arc::new(Mutex::new(0));
    let relation_mapped_counts = Arc::new(Mutex::new(HashMap::<String, usize>::new()));

    let pb = indicatif::ProgressBar::new(total_words as u64);
    pb.set_style(
        indicatif::ProgressStyle::default_bar()
            .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {pos}/{len} words ({eta})")
            .unwrap()
            .progress_chars("#>-"),
    );

    let words_vec: Vec<(String, HashSet<String>)> = lemma_to_synsets.into_iter().collect();

    let processed_words: Vec<MeiliWord> = words_vec
        .par_iter()
        .map(|(lemma, synset_ids)| {
            let word_id = format!("word_{}", normalize_id(lemma));
            let mut word = match words.get(&word_id) {
                Some(w) => w.clone(),
                None => return None,
            };

            let mut pos_set = HashSet::new();
            let data_synsets = &data_synsets;
            let data_senses = &data_senses;
            let data_lexical_entries = &data_lexical_entries;
            let sense_to_lemma = &sense_to_lemma;
            let synset_to_lemmas = &synset_to_lemmas;

            for synset_id in synset_ids {
                let synset = match data_synsets.get(synset_id) {
                    Some(s) => s,
                    None => continue,
                };

                if let Some(def) = &synset.definition {
                    if !def.trim().is_empty() {
                        let pos_prefix = if !synset.part_of_speech.is_empty() {
                            format!("({}) ", synset.part_of_speech)
                        } else {
                            String::new()
                        };
                        word.definitions
                            .push(format!("{}{}", pos_prefix, def.trim()));
                    }
                }

                if !synset.part_of_speech.is_empty() {
                    pos_set.insert(synset.part_of_speech.clone());
                }

                for example in &synset.examples {
                    if !example.trim().is_empty() {
                        word.examples.push(example.trim().to_string());
                    }
                }

                if let Some(members) = synset_to_lemmas.get(synset_id) {
                    for member in members {
                        if member.to_lowercase() != lemma.to_lowercase() {
                            word.synonyms.push(member.clone());
                            update_relation_count(&relation_mapped_counts, "synonyms".to_string());
                        }
                    }
                }

                process_synset_relations(
                    &mut word,
                    synset,
                    lemma,
                    synset_to_lemmas,
                    &relation_mapped_counts,
                );
            }

            process_sense_relations_parallel(
                lemma,
                &mut word,
                data_senses,
                sense_to_lemma,
                data_lexical_entries,
                &relation_mapped_counts,
            );

            word.pos = pos_set.into_iter().collect();

            deduplicate(&mut word.synonyms);
            deduplicate(&mut word.antonyms);
            deduplicate(&mut word.broader_terms);
            deduplicate(&mut word.narrower_terms);
            deduplicate(&mut word.related_terms);
            deduplicate(&mut word.examples);
            deduplicate(&mut word.definitions);

            let mut counter = counter.lock().unwrap();
            *counter += 1;
            pb.inc(1);

            Some(word)
        })
        .filter_map(|word| word)
        .collect();

    pb.finish_with_message("Processing complete");

    let result = processed_words;

    let relation_mapped_counts = Arc::try_unwrap(relation_mapped_counts)
        .unwrap()
        .into_inner()
        .unwrap();

    println!("\nRelation Mapping Statistics:");
    for (rel_type, count) in &relation_mapped_counts {
        println!("  {}: {} relationships mapped", rel_type, count);
    }

    let words_with_synonyms = result.iter().filter(|w| !w.synonyms.is_empty()).count();
    let words_with_antonyms = result.iter().filter(|w| !w.antonyms.is_empty()).count();
    let words_with_broader = result
        .iter()
        .filter(|w| !w.broader_terms.is_empty())
        .count();
    let words_with_narrower = result
        .iter()
        .filter(|w| !w.narrower_terms.is_empty())
        .count();
    let words_with_related = result
        .iter()
        .filter(|w| !w.related_terms.is_empty())
        .count();

    println!("\nRelationship Coverage:");
    println!(
        "  Words with synonyms: {} ({}%)",
        words_with_synonyms,
        words_with_synonyms * 100 / result.len()
    );
    println!(
        "  Words with antonyms: {} ({}%)",
        words_with_antonyms,
        words_with_antonyms * 100 / result.len()
    );
    println!(
        "  Words with broader terms: {} ({}%)",
        words_with_broader,
        words_with_broader * 100 / result.len()
    );
    println!(
        "  Words with narrower terms: {} ({}%)",
        words_with_narrower,
        words_with_narrower * 100 / result.len()
    );
    println!(
        "  Words with related terms: {} ({}%)",
        words_with_related,
        words_with_related * 100 / result.len()
    );

    let mut top_words: Vec<&MeiliWord> = result.iter().collect();
    top_words.sort_by(|a, b| {
        let a_count = a.synonyms.len()
            + a.antonyms.len()
            + a.broader_terms.len()
            + a.narrower_terms.len()
            + a.related_terms.len();
        let b_count = b.synonyms.len()
            + b.antonyms.len()
            + b.broader_terms.len()
            + b.narrower_terms.len()
            + b.related_terms.len();
        b_count.cmp(&a_count)
    });

    println!("\nWords with most relationships:");
    for word in top_words.iter().take(10) {
        let total = word.synonyms.len()
            + word.antonyms.len()
            + word.broader_terms.len()
            + word.narrower_terms.len()
            + word.related_terms.len();
        println!(
            "  {}: {} relationships ({} syn, {} ant, {} broader, {} narrower, {} related, {} defs)",
            word.word,
            total,
            word.synonyms.len(),
            word.antonyms.len(),
            word.broader_terms.len(),
            word.narrower_terms.len(),
            word.related_terms.len(),
            word.definitions.len()
        );
    }

    println!(
        "Created {} documents for Meilisearch in {:.2?}",
        result.len(),
        start_time.elapsed()
    );

    result
}

fn update_relation_count(counts: &Arc<Mutex<HashMap<String, usize>>>, rel_type: String) {
    let mut counts = counts.lock().unwrap();
    *counts.entry(rel_type).or_insert(0) += 1;
}

fn process_synset_relations(
    word: &mut MeiliWord,
    synset: &crate::models::Synset,
    lemma: &str,
    synset_to_lemmas: &HashMap<String, Vec<String>>,
    relation_mapped_counts: &Arc<Mutex<HashMap<String, usize>>>,
) {
    for relation in &synset.relations {
        let target_synset_id = &relation.target;
        let target_words = match synset_to_lemmas.get(target_synset_id) {
            Some(members) => members.clone(),
            None => continue,
        };

        if target_words.is_empty() {
            continue;
        }

        match relation.rel_type.as_str() {
            // ======== BROADER TERMS ========
            // Hypernym relations (X is a kind of Y)
            "hypernym" | "instance_hypernym" => {
                for target_word in target_words {
                    if target_word.to_lowercase() != lemma.to_lowercase() {
                        word.broader_terms.push(target_word.clone());
                        update_relation_count(relation_mapped_counts, "broader_terms".to_string());
                    }
                }
            }
            // Holonym relations (X is part of Y)
            "holo_member" | "holo_part" | "holo_substance" | "part_holonym" | "member_holonym"
            | "substance_holonym" | "holo_location" | "holo_portion" => {
                for target_word in target_words {
                    if target_word.to_lowercase() != lemma.to_lowercase() {
                        word.broader_terms.push(target_word.clone());
                        update_relation_count(relation_mapped_counts, "broader_terms".to_string());
                    }
                }
            }

            // ======== NARROWER TERMS ========
            // Hyponym relations (Y is a kind of X)
            "hyponym" | "instance_hyponym" => {
                for target_word in target_words {
                    if target_word.to_lowercase() != lemma.to_lowercase() {
                        word.narrower_terms.push(target_word.clone());
                        update_relation_count(relation_mapped_counts, "narrower_terms".to_string());
                    }
                }
            }
            // Meronym relations (Y is part of X)
            "mero_member" | "mero_part" | "mero_substance" | "part_meronym" | "member_meronym"
            | "substance_meronym" | "mero_location" | "mero_portion" => {
                for target_word in target_words {
                    if target_word.to_lowercase() != lemma.to_lowercase() {
                        word.narrower_terms.push(target_word.clone());
                        update_relation_count(relation_mapped_counts, "narrower_terms".to_string());
                    }
                }
            }

            // ======== ANTONYMS ========
            // Opposition relationships
            "antonym" | "anto_gradable" | "anto_simple" | "anto_converse" | "near_antonym" => {
                for target_word in target_words {
                    if target_word.to_lowercase() != lemma.to_lowercase() {
                        word.antonyms.push(target_word.clone());
                        update_relation_count(relation_mapped_counts, "antonyms".to_string());
                    }
                }
            }

            // ======== SYNONYMS ========
            // Similarity relationships
            "similar" | "also" | "verb_group" | "eq_synonym" | "ir_synonym" => {
                for target_word in target_words {
                    if target_word.to_lowercase() != lemma.to_lowercase() {
                        word.synonyms.push(target_word.clone());
                        update_relation_count(relation_mapped_counts, "synonyms".to_string());
                    }
                }
            }

            // ======== RELATED TERMS ========
            // All other relationship types
            _ => {
                for target_word in target_words {
                    if target_word.to_lowercase() != lemma.to_lowercase() {
                        word.related_terms.push(target_word.clone());
                        update_relation_count(relation_mapped_counts, "related_terms".to_string());
                    }
                }
            }
        }
    }
}

fn process_sense_relations_parallel(
    source_lemma: &str,
    word: &mut MeiliWord,
    senses: &HashMap<String, crate::models::Sense>,
    sense_to_lemma: &HashMap<String, String>,
    lexical_entries: &HashMap<String, crate::models::LexicalEntry>,
    relation_mapped_counts: &Arc<Mutex<HashMap<String, usize>>>,
) {
    let source_sense_ids: Vec<String> = lexical_entries
        .values()
        .filter(|le| le.lemma.written_form.to_lowercase() == source_lemma.to_lowercase())
        .flat_map(|le| le.senses.clone())
        .collect();

    for sense_id in &source_sense_ids {
        if let Some(sense) = senses.get(sense_id) {
            // Add examples from this sense
            for example in &sense.examples {
                if !example.trim().is_empty() {
                    word.examples.push(example.clone());
                }
            }

            for relation in &sense.relations {
                if let Some(target_lemma) = sense_to_lemma.get(&relation.target) {
                    if target_lemma.trim().is_empty()
                        || target_lemma.to_lowercase() == source_lemma.to_lowercase()
                    {
                        continue;
                    }

                    match relation.rel_type.as_str() {
                        // ======== ANTONYMS ========
                        "antonym" | "anto_gradable" | "anto_simple" | "anto_converse"
                        | "near_antonym" => {
                            word.antonyms.push(target_lemma.clone());
                            update_relation_count(relation_mapped_counts, "antonyms".to_string());
                        }

                        // ======== SYNONYMS ========
                        "similar" | "also" | "verb_group" | "similar_to" | "see_also" => {
                            word.synonyms.push(target_lemma.clone());
                            update_relation_count(relation_mapped_counts, "synonyms".to_string());
                        }

                        // ======== BROADER TERMS ========
                        "hypernym" | "instance_hypernym" => {
                            word.broader_terms.push(target_lemma.clone());
                            update_relation_count(
                                relation_mapped_counts,
                                "broader_terms".to_string(),
                            );
                        }

                        // ======== NARROWER TERMS ========
                        "hyponym" | "instance_hyponym" => {
                            word.narrower_terms.push(target_lemma.clone());
                            update_relation_count(
                                relation_mapped_counts,
                                "narrower_terms".to_string(),
                            );
                        }

                        // ======== RELATED TERMS ========
                        // Derivational and semantic
                        "participle"
                        | "derivation"
                        | "pertainym"
                        | "domain_topic"
                        | "domain_member_topic"
                        | "domain_region"
                        | "domain_member_region"
                        | "exemplifies"
                        | "is_exemplified_by" => {
                            word.related_terms.push(target_lemma.clone());
                            update_relation_count(
                                relation_mapped_counts,
                                "related_terms".to_string(),
                            );
                        }

                        _ => {
                            word.related_terms.push(target_lemma.clone());
                            update_relation_count(
                                relation_mapped_counts,
                                "related_terms".to_string(),
                            );
                        }
                    }
                }
            }
        }
    }
}

fn deduplicate(vec: &mut Vec<String>) {
    vec.sort();
    vec.dedup();
}

fn normalize_id(s: &str) -> String {
    s.to_lowercase()
        .replace([' ', '-'], "_")
        .replace(['\'', '.'], "")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_')
        .collect()
}

fn is_valid_lemma(lemma: &str) -> bool {
    lemma.chars().all(|c| {
        c.is_alphanumeric()
            || c.is_whitespace()
            || c == '-'
            || c == '\''
            || c == '.'
            || c == ','
            || c == '('
            || c == ')'
            || c == '/'
    })
}
