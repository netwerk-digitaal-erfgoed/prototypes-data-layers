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
