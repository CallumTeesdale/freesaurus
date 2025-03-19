FROM rust:slim-bookworm as builder

WORKDIR /app

RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev && \
    rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./

COPY . .

RUN cargo build --release

FROM debian:bookworm-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y libssl3 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/wordnet-importer /usr/local/bin/

# Set default environment variables
ENV RUST_LOG=info
ENV MEILI_URL=http://localhost:7700

ENTRYPOINT ["wordnet-importer"]
CMD []