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

## Run Valeros with Docker

Set the `.env` file:

    cp .env.dist .env

Install packages:

    docker compose run --env-from-file .env --rm node npm install --no-progress

Run the Valeros search engine and API:

    docker compose up valeros-typesense valeros-api

In another terminal, build the Valeros CLI:

    docker build -f apps/valeros-cli/Dockerfile -t valeros-cli .

Import data into the search index with the Valeros CLI:

    docker run --network host -i --rm --env-file .env -t valeros-cli ./import.sh

Use the Valeros API:

    curl -i http://localhost:3000/health

    curl http://localhost:3000/v1/heritage-objects

    curl http://localhost:3000/v1/heritage-objects/page/1

    curl http://localhost:3000/v1/heritage-objects/page/1?size=10&q=nederland

    curl http://localhost:3000/v1/heritage-objects/page/1?size=10&q=onderwijs&filter=contentLocation%3ABerlijn

    curl http://localhost:3000/v1/heritage-objects/page/1?size=10&q=instrument&filter=contentLocation%3ANederland&filter=genre%3Anatuurkunde
