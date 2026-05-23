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

## Use the Valeros API

Check the health of the API:

    curl -i http://localhost:3000/health

### Datasets

Get the datasets collection:

    curl http://localhost:3000/v1/datasets

Get the datasets on the first page of the collection:

    curl http://localhost:3000/v1/datasets/page/1

Find the datasets that match query `museum`:

    curl http://localhost:3000/v1/datasets/page/1?q=museum

Get a specific dataset:

    curl http://localhost:3000/v1/datasets/d4331be13e4a352d438e7b0f9d1374db

### Heritage objects

Get the heritage objects collection:

    curl http://localhost:3000/v1/heritage-objects

Get the heritage objects on the first page of the collection:

    curl http://localhost:3000/v1/heritage-objects/page/1

Find the heritage objects that match query `nederland`:

    curl http://localhost:3000/v1/heritage-objects/page/1?q=nederland

Find the heritage objects that match query `onderwijs` and that are about location `Berlijn`:

    curl http://localhost:3000/v1/heritage-objects/page/1?q=onderwijs&filter=contentLocation%3ABerlijn

Find the heritage objects that match query `instrument`, that are about location `Nederland` and that are of genre `natuurkunde`:

    curl http://localhost:3000/v1/heritage-objects/page/1?q=instrument&filter=contentLocation%3ANederland&filter=genre%3Anatuurkunde

Find the heritage objects that match terms with name `natuurlijke historie` (mind the backticks, for escaping) in field "genre":

    curl http://localhost:3000/v1/heritage-objects/page/1?filter=genre%3A%3D%60natuurlijke%20historie%60

Find the heritage objects that match the term with ID `http://localhost:3000/v1/terms/a5b066b96fac9f0e71534f1a7811a24a` in field "genre":

    curl http://localhost:3000/v1/heritage-objects/page/1?filter=genre.id%3Ahttp%3A%2F%2Flocalhost%3A3000%2Fv1%2Fterms%2F26abb4f2d20483c594b6ec695240071e

Find the heritage objects that match the term with ID `http://localhost:3000/v1/terms/a5b066b96fac9f0e71534f1a7811a24a` regardless of field (`*`):

    curl http://localhost:3000/v1/heritage-objects/page/1?filter=%2A.id%3Ahttp%3A%2F%2Flocalhost%3A3000%2Fv1%2Fterms%2F26abb4f2d20483c594b6ec695240071e

Get a specific heritage object:

    curl http://localhost:3000/v1/heritage-objects/f3cb201d0d6068c4c959f352b49a7587

### Licenses

Get the licenses collection:

    curl http://localhost:3000/v1/licenses

Get the licenses on the first page of the collection:

    curl http://localhost:3000/v1/licenses/page/1

Find the licenses that match query `naamsvermelding`:

    curl http://localhost:3000/v1/licenses/page/1?q=naamsvermelding

Get a specific license:

    curl http://localhost:3000/v1/licenses/4ff4afb1d8fbd5ac46438c5d5029a99f

### Organizations

Get the organizations collection:

    curl http://localhost:3000/v1/organizations

Get the organizations on the first page of the collection:

    curl http://localhost:3000/v1/organizations/page/1

Find the organizations that match query `museum`:

    curl http://localhost:3000/v1/organizations/page/1?q=museum

Get a specific organization:

    curl http://localhost:3000/v1/organizations/bd9243c366eff50a6be20517d0a0bb4a

### Persons

Get the persons collection:

    curl http://localhost:3000/v1/persons

Get the persons on the first page of the collection:

    curl http://localhost:3000/v1/persons/page/1

Find the persons that match query `rob`:

    curl http://localhost:3000/v1/persons/page/1?q=rob

Get a specific person:

    curl http://localhost:3000/v1/persons/07e69c4737983d14f0d2970d58c78a2c

### Places

Get the places collection:

    curl http://localhost:3000/v1/places

Get the places on the first page of the collection:

    curl http://localhost:3000/v1/places/page/1

Find the places that match query `haag`:

    curl http://localhost:3000/v1/places/page/1?q=haag

Get a specific place:

    curl http://localhost:3000/v1/places/e5a4bcf4c80b59d89dd5661b9f1893bd

### Terms

Get the terms collection:

    curl http://localhost:3000/v1/terms

Get the terms on the first page of the collection:

    curl http://localhost:3000/v1/terms/page/1

Find the terms that match query `werk`:

    curl http://localhost:3000/v1/terms/page/1?q=werk

Get a specific term:

    curl http://localhost:3000/v1/terms/9688aebbdc49d16ff0a8ff8586e32f6f
