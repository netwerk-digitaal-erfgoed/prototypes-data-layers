# Valeros CLI

CLI of the data layer of Valeros

## Development with Docker

Run these commands in the root of the repo:

### Build

    docker build -f apps/valeros-cli/Dockerfile -t valeros-cli .

### Run

    docker run --network host -i --rm -v "$PWD":/app --env-file .env -t valeros-cli

### Steps for ingesting dataset distributions into the search index

    npm run build

    cd apps/valeros-cli

    ./scripts/prepare.sh --output-file data/ingest.jsonld

    ./dist/valeros.mjs prepare --input-file data/ingest.jsonld --output-dir data/ingest

    ./dist/valeros.mjs ingest --input-dir data/ingest
