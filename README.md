# Prototypes data layers

> [!WARNING]
> The prototypes are for illustration and discussion - they have no official standing.

## Development with Docker

Install packages:

    docker compose run --env-from-file .env --rm node npm install --no-progress

Run the Node service:

    docker compose run --env-from-file .env --rm node

Run the Valeros services:

    docker compose up valeros-typesense valeros-api

## Running Valeros with Docker

Install packages:

    docker compose run --env-from-file .env --rm node npm install --no-progress

Run the Valeros search engine and API:

    docker compose up valeros-typesense valeros-api

In another terminal, build the Valeros CLI:

    docker build -f apps/valeros-cli/Dockerfile -t valeros-cli .

Import data into the search engine with the Valeros CLI:

    docker run --network host -i --rm --env-file .env -t valeros-cli

Then:

    ./prepare.sh --url "https://collections.uu.nl/datadump_28-03-2026.jsonld.gz" --query-file "queries/collections-uu.rq" --output-file "data/collections-uu.jsonld"
    ./valeros.mjs prepare --input-file "data/collections-uu.jsonld" --output-dir "data"
    ./valeros.mjs ingest --input-dir "data"
    exit

Use the Valeros API:

    curl -i http://localhost:3000/health
    curl http://localhost:3000/v1/heritage-objects
    curl http://localhost:3000/v1/heritage-objects/page/1
    curl http://localhost:3000/v1/heritage-objects/page/1?size=10&q=onderwijs&filter=contentLocation%3ABerlijn
