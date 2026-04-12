# Valeros CLI

CLI for the data layer of Valeros. For use in development only.

## Build

    docker build -t valeros-cli .

## Run

    docker run -i --rm -v "$PWD":/app -t valeros-cli

## Prepare datasets for ingestion into the search index

    scripts/prepare.sh --url "https://collections.uu.nl/datadump_28-03-2026.jsonld.gz" --query-file "queries/collections-uu.rq" --output-file "data/collections-uu.jsonld"

## Convert

    npm run build && ./dist/valeros.mjs prepare --input-file data/collections-uu.jsonld --output-dir data
    npm run build && ./dist/valeros.mjs ingest --input-dir data
