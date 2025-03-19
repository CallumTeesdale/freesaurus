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

COPY --from=builder /app/target/release/thesaurus-api /usr/local/bin/

COPY --from=builder /app/migrations /app/migrations

EXPOSE 3000

ENV RUST_LOG=info \
    PORT=3000 \
    HOST=0.0.0.0

CMD ["thesaurus-api"]