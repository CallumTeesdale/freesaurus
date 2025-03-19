use anyhow::{Context, Result};
use clap::Parser;
use indicatif::{ProgressBar, ProgressStyle};
use reqwest::Client;
use std::path::PathBuf;
use std::time::Duration;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;

mod models;
mod parser;
mod transform;

use models::MeiliWord;
use parser::parse_wordnet_xml;
use transform::transform_to_meilisearch;

const WORDNET_URL: &str = "https://en-word.net/static/english-wordnet-2024.xml.gz";
const BATCH_SIZE: usize = 1000;

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Meilisearch URL
    #[arg(long, default_value = "http://localhost:7700", env = "MEILI_URL")]
    meili_url: String,

    /// Meilisearch API key
    #[arg(long, env = "MEILI_KEY")]
    meili_key: Option<String>,

    /// Meilisearch index name
    #[arg(long, default_value = "words")]
    index: String,

    /// Path to WordNet XML file (if not provided, will download the latest)
    #[arg(long)]
    xml_path: Option<PathBuf>,

    /// Skip the Meilisearch upload (just process the XML)
    #[arg(long)]
    skip_upload: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    let (xml_path, _temp_dir) = match &args.xml_path {
        Some(path) => (path.clone(), None),
        None => {
            let (path, temp_dir) = download_wordnet().await?;
            (path, Some(temp_dir))
        }
    };

    println!("Parsing WordNet XML file at {}...", xml_path.display());
    let wordnet_data = parse_wordnet_xml(&xml_path).await?;

    println!(
        "Parsed {} synsets and {} lexical entries",
        wordnet_data.synsets.len(),
        wordnet_data.lexical_entries.len()
    );

    println!("Transforming data for Meilisearch...");
    let meili_docs = transform_to_meilisearch(&wordnet_data);

    println!("Created {} documents for Meilisearch", meili_docs.len());

    if !args.skip_upload {
        println!("Uploading to Meilisearch...");
        upload_to_meilisearch(
            &args.meili_url,
            args.meili_key.as_deref(),
            &args.index,
            &meili_docs,
        )
        .await?;
    }

    println!("Done!");
    Ok(())
}

async fn download_wordnet() -> Result<(PathBuf, tempfile::TempDir)> {
    println!("Downloading WordNet from {}...", WORDNET_URL);

    let client = Client::new();
    let temp_dir = tempfile::tempdir()?;

    let response = client
        .get(WORDNET_URL)
        .send()
        .await
        .context("Failed to download WordNet")?;

    let total_size = response
        .content_length()
        .context("Failed to get content length")?;

    let pb = ProgressBar::new(total_size);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {bytes}/{total_bytes} ({eta})")
            .unwrap()
            .progress_chars("#>-"),
    );

    let gz_path = temp_dir.path().join("wordnet.gz");
    let mut file = File::create(&gz_path).await?;
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    while let Some(item) = futures_util::StreamExt::next(&mut stream).await {
        let chunk = item?;
        file.write_all(&chunk).await?;
        downloaded += chunk.len() as u64;
        pb.set_position(downloaded);
    }

    pb.finish_with_message("Download complete");

    println!("Extracting gzip file...");

    let xml_path = temp_dir.path().join("english-wordnet-2024.xml");

    let gz_file = std::fs::File::open(&gz_path)
        .context(format!("Failed to open gz file at {}", gz_path.display()))?;

    let mut gz_decoder = flate2::read::GzDecoder::new(gz_file);
    let mut xml_file = std::fs::File::create(&xml_path).context(format!(
        "Failed to create XML file at {}",
        xml_path.display()
    ))?;

    std::io::copy(&mut gz_decoder, &mut xml_file).context("Failed to decompress gzip file")?;

    drop(xml_file);

    println!("Extracted to {}", xml_path.display());

    println!(
        "Listing directory contents of {}:",
        temp_dir.path().display()
    );
    for entry in std::fs::read_dir(temp_dir.path())? {
        let entry = entry?;
        println!("  {}", entry.path().display());
    }

    if !xml_path.exists() {
        anyhow::bail!("Extracted file doesn't exist at {}", xml_path.display());
    }

    Ok((xml_path, temp_dir))
}

async fn upload_to_meilisearch(
    url: &str,
    api_key: Option<&str>,
    index_name: &str,
    documents: &[MeiliWord],
) -> Result<()> {
    let client = meilisearch_sdk::client::Client::new(url, api_key);

    let mut index = client.index(index_name);

    match index.get_primary_key().await {
        Ok(primary_key) => {
            if primary_key.is_none() || primary_key != Some("id") {
                println!("Setting primary key to 'id'");
                index.set_primary_key("id").await?;
            }
        }
        Err(_) => {
            println!("Setting primary key to 'id'");
            index.set_primary_key("id").await?;
        }
    }

    println!("Configuring index settings...");

    println!("Setting searchable attributes");
    index
        .set_searchable_attributes(&["word", "definitions", "synonyms", "antonyms", "examples"])
        .await?;

    println!("Setting filterable attributes");
    index.set_filterable_attributes(&["pos", "word"]).await?;

    println!("Setting sortable attributes");
    index.set_sortable_attributes(&["word"]).await?;

    println!("Setting ranking rules");
    index
        .set_ranking_rules(&[
            "words",
            "typo",
            "proximity",
            "attribute",
            "sort",
            "exactness",
        ])
        .await?;

    let total_batches = documents.len().div_ceil(BATCH_SIZE);
    let pb = ProgressBar::new(total_batches as u64);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {pos}/{len} batches ({eta})")?
            .progress_chars("#>-"),
    );

    for (i, chunk) in documents.chunks(BATCH_SIZE).enumerate() {
        let batch_num = i + 1;

        match index.add_documents(chunk, Some("id")).await {
            Ok(task) => {
                println!(
                    "Batch {} uploaded successfully. Task ID: {}",
                    batch_num, task.task_uid
                );
            }
            Err(e) => {
                println!("Warning: Failed to upload batch {}: {}", batch_num, e);
            }
        }

        tokio::time::sleep(Duration::from_millis(100)).await;

        pb.inc(1);
    }

    pb.finish_with_message("Upload complete");

    Ok(())
}
