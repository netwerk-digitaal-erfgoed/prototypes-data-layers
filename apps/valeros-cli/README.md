# Valeros CLI

CLI for the data layer of Valeros.

## Development with Docker

Run these commands in the root of the repo:

### Build

    docker build -f apps/valeros-cli/Dockerfile -t valeros-cli .

### Run

    docker run --network host -i --rm --env-file .env -t valeros-cli

### Steps for ingesting a dataset into the search index

    npm run build
    ./scripts/prepare.sh --url "https://collections.uu.nl/datadump_28-03-2026.jsonld.gz" --query-file "queries/collections-uu.rq" --output-file "data/collections-uu.jsonld"
    ./dist/valeros.mjs prepare --input-file "data/collections-uu.jsonld" --output-dir "data"
    ./dist/valeros.mjs ingest --input-dir "data"
