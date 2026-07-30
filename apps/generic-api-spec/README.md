# Generic API specification

> [!WARNING]
> This specification is intended solely for experimentation - do not use it in production

Run the commands underneath in the **root** of the monorepo.

## Install packages

    docker compose run --env-from-file .env --rm node npm install --no-progress

## Run

    docker compose run --env-from-file .env --rm node

## Start VitePress

    cd apps/generic-api-spec

    npm run dev

Go to http://localhost:5173/
