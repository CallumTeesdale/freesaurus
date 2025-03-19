use anyhow::{Context, Result};
use roxmltree::{Document, Node};
use std::collections::HashMap;
use std::path::Path;
use std::time::Instant;
use tokio::fs;

use crate::models::{
    Lemma, LexicalEntry, Sense, SenseRelation, Synset, SynsetRelation, WordNetData,
};

pub async fn parse_wordnet_xml(path: &Path) -> Result<WordNetData> {
    println!("Opening WordNet XML file at {}", path.display());

    let start_time = Instant::now();

    if !path.exists() {
        return Err(anyhow::anyhow!("File does not exist: {}", path.display()));
    }

    let content = match fs::read(path).await {
        Ok(content) => {
            println!("Successfully read file with size: {} bytes", content.len());
            content
        }
        Err(e) => {
            println!("Error reading file: {}", e);
            return Err(anyhow::anyhow!("Failed to read XML file: {}", e));
        }
    };

    println!("Parsing XML document...");
    let xml_string = String::from_utf8_lossy(&content);
    let options = roxmltree::ParsingOptions {
        allow_dtd: true,
        ..roxmltree::ParsingOptions::default()
    };
    let doc = match Document::parse_with_options(&xml_string, options) {
        Ok(doc) => doc,
        Err(e) => {
            println!("Error parsing XML: {}", e);
            return Err(anyhow::anyhow!("Failed to parse XML: {}", e));
        }
    };

    println!(
        "XML document parsed successfully in {:.2?}",
        start_time.elapsed()
    );

    println!("Analyzing document structure...");
    let root = doc.root();
    let mut found_lexical_resource = false;
    let mut found_lexicon = false;

    let lexical_resource = doc
        .root()
        .children()
        .find(|n| n.is_element() && n.tag_name().name() == "LexicalResource");

    if let Some(lr) = lexical_resource {
        found_lexical_resource = true;
        println!("Found LexicalResource element");

        let lexicons: Vec<_> = lr
            .children()
            .filter(|n| n.is_element() && n.tag_name().name() == "Lexicon")
            .collect();

        if !lexicons.is_empty() {
            found_lexicon = true;
            println!("Found {} Lexicon elements", lexicons.len());
        } else {
            println!("No Lexicon elements found under LexicalResource");
        }
    } else {
        println!("LexicalResource element not found");
    }

    if !found_lexical_resource || !found_lexicon {
        println!("\nDocument structure preview:");
        let mut count = 0;
        for node in doc.root().descendants().filter(|n| n.is_element()) {
            if count < 10 {
                println!("  Element: <{}>", node.tag_name().name());
                for attr in node.attributes() {
                    println!("    Attribute: {}=\"{}\"", attr.name(), attr.value());
                }
                count += 1;
            } else {
                break;
            }
        }
    }

    let mut synsets = HashMap::new();
    let mut lexical_entries = HashMap::new();
    let mut senses = HashMap::new();

    let mut synset_relation_count = 0;
    let mut sense_relation_count = 0;

    println!("Processing lexicons...");
    let pb = indicatif::ProgressBar::new_spinner();
    pb.set_message("Processing lexicons...");
    pb.enable_steady_tick(std::time::Duration::from_millis(100));

    if let Some(lr) = lexical_resource {
        for lexicon in lr
            .children()
            .filter(|n| n.is_element() && n.tag_name().name() == "Lexicon")
        {
            let lexicon_id = lexicon.attribute("id").unwrap_or("unknown");
            let language = lexicon.attribute("language").unwrap_or("unknown");
            let label = lexicon.attribute("label").unwrap_or("unknown");

            println!(
                "Processing lexicon: {} ({}) - Language: {}",
                lexicon_id, label, language
            );

            let mut entry_count = 0;
            for entry_node in lexicon
                .children()
                .filter(|n| n.is_element() && n.tag_name().name() == "LexicalEntry")
            {
                process_lexical_entry(
                    entry_node,
                    &mut lexical_entries,
                    &mut senses,
                    &mut sense_relation_count,
                )?;

                entry_count += 1;
                if entry_count % 5000 == 0 {
                    pb.set_message(format!("Processed {} lexical entries...", entry_count));
                }
            }

            let mut synset_count = 0;
            for synset_node in lexicon
                .children()
                .filter(|n| n.is_element() && n.tag_name().name() == "Synset")
            {
                process_synset(synset_node, &mut synsets, &mut synset_relation_count)?;

                synset_count += 1;
                if synset_count % 10000 == 0 {
                    pb.set_message(format!("Processed {} synsets...", synset_count));
                }
            }

            println!(
                "Processed {} lexical entries and {} synsets in lexicon '{}'",
                entry_count, synset_count, lexicon_id
            );
        }
    } else {
        println!(
            "Warning: No LexicalResource element found. XML might not match expected structure."
        );
    }

    pb.finish_with_message(format!(
        "Parsing complete: {} lexical entries, {} senses, {} synsets, {} relations",
        lexical_entries.len(),
        senses.len(),
        synsets.len(),
        synset_relation_count + sense_relation_count
    ));

    println!(
        "Synset relations: {}, Sense relations: {}",
        synset_relation_count, sense_relation_count
    );

    if synset_relation_count > 0 {
        println!("Sample synset relations:");
        let mut count = 0;
        for synset in synsets.values() {
            for rel in &synset.relations {
                if count < 5 {
                    println!(
                        "  Synset {} -> {} -> {}",
                        synset.id, rel.rel_type, rel.target
                    );
                    count += 1;
                } else {
                    break;
                }
            }
            if count >= 5 {
                break;
            }
        }
    }

    if sense_relation_count > 0 {
        println!("Sample sense relations:");
        let mut count = 0;
        for sense in senses.values() {
            for rel in &sense.relations {
                if count < 5 {
                    println!("  Sense {} -> {} -> {}", sense.id, rel.rel_type, rel.target);
                    count += 1;
                } else {
                    break;
                }
            }
            if count >= 5 {
                break;
            }
        }
    }

    println!("Total parsing time: {:.2?}", start_time.elapsed());

    Ok(WordNetData {
        synsets,
        lexical_entries,
        senses,
    })
}

fn process_lexical_entry(
    node: Node,
    lexical_entries: &mut HashMap<String, LexicalEntry>,
    senses: &mut HashMap<String, Sense>,
    sense_relation_count: &mut usize,
) -> Result<()> {
    let id = node.attribute("id").context("LexicalEntry missing id")?;

    let mut entry = LexicalEntry {
        id: id.to_string(),
        lemma: Lemma {
            written_form: String::new(),
            part_of_speech: String::new(),
        },
        senses: Vec::new(),
    };

    if let Some(lemma_node) = node
        .children()
        .find(|n| n.is_element() && n.tag_name().name() == "Lemma")
    {
        let written_form = lemma_node
            .attribute("writtenForm")
            .unwrap_or("")
            .to_string();
        let pos = lemma_node
            .attribute("partOfSpeech")
            .unwrap_or("")
            .to_string();

        entry.lemma.written_form = written_form;
        entry.lemma.part_of_speech = pos;
    }

    for sense_node in node
        .children()
        .filter(|n| n.is_element() && n.tag_name().name() == "Sense")
    {
        let sense_id = sense_node.attribute("id").context("Sense missing id")?;
        let synset_id = sense_node
            .attribute("synset")
            .context("Sense missing synset")?;

        let mut sense = Sense {
            id: sense_id.to_string(),
            synset_id: synset_id.to_string(),
            relations: Vec::new(),
            examples: Vec::new(),
        };

        entry.senses.push(sense_id.to_string());

        for relation_node in sense_node
            .children()
            .filter(|n| n.is_element() && n.tag_name().name() == "SenseRelation")
        {
            let rel_type = relation_node
                .attribute("relType")
                .context("SenseRelation missing relType")?;
            let target = relation_node
                .attribute("target")
                .context("SenseRelation missing target")?;

            sense.relations.push(SenseRelation {
                rel_type: rel_type.to_string(),
                target: target.to_string(),
            });

            *sense_relation_count += 1;
        }

        for example_node in sense_node.children().filter(|n| {
            (n.is_element() && n.tag_name().name() == "SenseExample")
                || (n.is_element() && n.tag_name().name() == "Example")
        }) {
            if let Some(text) = example_node.text() {
                sense.examples.push(text.trim().to_string());
            }
        }

        senses.insert(sense_id.to_string(), sense);
    }

    if !entry.lemma.written_form.trim().is_empty() {
        lexical_entries.insert(id.to_string(), entry);
    }

    Ok(())
}

fn process_synset(
    node: Node,
    synsets: &mut HashMap<String, Synset>,
    synset_relation_count: &mut usize,
) -> Result<()> {
    let id = node.attribute("id").context("Synset missing id")?;

    let ili = node.attribute("ili").map(|s| s.to_string());
    let pos = node.attribute("partOfSpeech").unwrap_or("").to_string();

    let members = node
        .attribute("members")
        .map(|s| s.split_whitespace().map(|id| id.to_string()).collect())
        .unwrap_or_default();

    let mut synset = Synset {
        id: id.to_string(),
        ili,
        part_of_speech: pos,
        definition: None,
        examples: Vec::new(),
        relations: Vec::new(),
        members,
    };

    if let Some(def_node) = node
        .children()
        .find(|n| n.is_element() && n.tag_name().name() == "Definition")
    {
        if let Some(text) = def_node.text() {
            synset.definition = Some(text.trim().to_string());
        }
    }

    if synset.definition.is_none() {
        if let Some(ili_def_node) = node
            .children()
            .find(|n| n.is_element() && n.tag_name().name() == "ILIDefinition")
        {
            if let Some(text) = ili_def_node.text() {
                synset.definition = Some(text.trim().to_string());
            }
        }
    }

    for example_node in node
        .children()
        .filter(|n| n.is_element() && n.tag_name().name() == "Example")
    {
        if let Some(text) = example_node.text() {
            synset.examples.push(text.trim().to_string());
        }
    }

    for relation_node in node
        .children()
        .filter(|n| n.is_element() && n.tag_name().name() == "SynsetRelation")
    {
        let rel_type = relation_node
            .attribute("relType")
            .context("SynsetRelation missing relType")?;
        let target = relation_node
            .attribute("target")
            .context("SynsetRelation missing target")?;

        synset.relations.push(SynsetRelation {
            rel_type: rel_type.to_string(),
            target: target.to_string(),
        });

        *synset_relation_count += 1;
    }

    synsets.insert(id.to_string(), synset);

    Ok(())
}
