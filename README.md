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

Check the health of the API:

    curl -i http://localhost:3000/health

Get the heritage objects collection:

    curl http://localhost:3000/v1/heritage-objects

Get the heritage objects on the first page of the collection:

    curl http://localhost:3000/v1/heritage-objects/page/1

Find the heritage objects that match query `nederland`:

    curl http://localhost:3000/v1/heritage-objects/page/1?size=10&q=nederland

Find the heritage objects that match query `onderwijs` and that are about location `Berlijn`:

    curl http://localhost:3000/v1/heritage-objects/page/1?size=10&q=onderwijs&filter=contentLocation%3ABerlijn

Find the heritage objects that match query `instrument`, that are about location `Nederland` and that are of genre `natuurkunde`:

    curl http://localhost:3000/v1/heritage-objects/page/1?size=10&q=instrument&filter=contentLocation%3ANederland&filter=genre%3Anatuurkunde

Find the heritage objects that match genre `natuurlijke historie` (mind the backticks):

    curl http://localhost:3000/v1/heritage-objects/page/1?size=10&filter=genre%3A%3Dnatuurlijke+historie%3D

Get a specific heritage object:

    curl http://localhost:3000/v1/heritage-objects/f3cb201d0d6068c4c959f352b49a7587
