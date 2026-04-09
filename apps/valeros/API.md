# API specification

> [!WARNING]
> This is work in progress, for illustration and discussion. It has no official standing.

## Contents

- [About the API](#about-the-api)
- [Alignment with other API specifications](#alignment-with-other-api-specifications)
- [Authentication](#authentication)
- [Versioning](#versioning)
- [Errors](#errors)
- [Resource types](#resource-types)
- [Endpoints](#endpoints)
  - [Headers](#headers)
  - [List heritage objects in a paged collection](#list-heritage-objects-in-a-paged-collection)
  - [Get a single heritage object](#get-a-single-heritage-object)
  - [Get a single place](#get-a-single-place)
  - [Get a single organization](#get-a-single-organization)
  - [Get a single person](#get-a-single-person)
  - [Get a single occupation](#get-a-single-occupation)
  - [Get a single media object](#get-a-single-media-object)
  - [Get a single license](#get-a-single-license)
  - [Get a single term](#get-a-single-term)
  - [Get a single dataset](#get-a-single-dataset)
  - [Get the JSON-LD context](#get-the-json-ld-context)

## About the API

1. The API uses REST as its architectural style
1. The API uses [JSON-LD 1.1](https://www.w3.org/TR/json-ld/) as method for serializing data
1. The API primarily uses [SCHEMA-AP-NDE](https://docs.nde.nl/schema-profile/) as its data model, and parts of [Activity Streams](https://www.w3.org/TR/activitystreams-core/)

> [!NOTE]
>
> To do:
>
> 1. State the design goals of the API (e.g. use of JSON, use of LD, generic/blueprint)
> 1. How to model the provenance trail of the data, e.g. the original datasets that were used? Use [PROV-O](https://www.w3.org/TR/prov-o/)?
> 1. Think about CORS and e.g. the `Access-Control-Allow-Origin` header
> 1. Create [JSON Schemas](https://json-schema.org/)?

## Alignment with other API specifications

The API is not yet or not yet fully aligned with existing API specifications, such as:

1. [NLGov REST API Design Rules](https://gitdocumentatie.logius.nl/publicatie/api/adr/2.1.0/)
1. [API Design Rules Module: Geospatial](https://gitdocumentatie.logius.nl/publicatie/api/mod-geo/1.0.3/)
1. [Linked Art API](https://linked.art/api/1.0/)
1. [Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html), for errors
1. [Hydra Core Vocabulary](http://www.hydra-cg.com/spec/latest/core/), for collections and errors
1. [JSON Hypertext Application Language](https://www.ietf.org/archive/id/draft-kelly-json-hal-11.html)
1. [Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/)
1. [JSON:API](https://jsonapi.org/format/)

## Authentication

The API is open to everyone, without authentication.

## Versioning

> [!NOTE]
>
> To do: explain how API versioning works.

## Errors

The API uses common HTTP status codes: `2xx` for success, `4xx` for errors caused by the caller and `5xx` for server errors. The table underneath lists the most common errors that can occur:

| Status | Description                       |
| ------ | --------------------------------- |
| `400`  | The request is invalid            |
| `404`  | The resource does not exist       |
| `415`  | The content type is not supported |
| `500`  | A server error has occurred       |
| `503`  | The server is under maintenance   |

## Resource types

The API supports the following resource types:

1. Collections
1. Heritage objects
1. Places
1. Organizations
1. Persons
1. Occupations
1. Media objects
1. Licenses
1. Terms
1. Datasets

## Endpoints

### Headers

All endpoints accept and return the same HTTP headers:

#### Request headers

| Name            | Value                                      | Cardinality |
| --------------- | ------------------------------------------ | ----------- |
| Accept          | `application/ld+json,application/json,*/*` | 0 or 1      |
| Accept-Language | E.g. `nl` or `en`                          | 0 or 1      |

#### Response headers

| Name             | Value                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Status           | E.g. `200 OK`                                                                                              |
| Content-Type     | `application/json`                                                                                         |
| Content-Language | E.g. `nl` or `en`                                                                                          |
| Link             | `<https://example.org/v1/context>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"` |
| API-Version      | E.g. `1.0.0`                                                                                               |

### List heritage objects in a paged collection

#### Request

`GET /v1/heritage-objects/page/{page}?size={size}&q={q}`

##### URI parameters

| Property | Data type | Cardinality | Description              |
| -------- | --------- | ----------- | ------------------------ |
| `page`   | Number    | 1           | Page index               |
| `size`   | Number    | 0 or 1      | Number of items per page |
| `q`      | String    | 0 or 1      | Search query             |

#### Response

##### Example body

```json
{
  "id": "https://example.org/v1/heritage-objects/page/2?size=10&q=lab*",
  "type": "OrderedCollectionPage",
  "partOf": {
    "id": "https://example.org/v1/heritage-objects",
    "type": "OrderedCollection",
    "totalItems": 195,
    "first": "https://example.org/v1/heritage-objects/page/1?size=10&q=lab*",
    "last": "https://example.org/v1/heritage-objects/page/20?size=10&q=lab*"
  },
  "next": "https://example.org/v1/heritage-objects/page/3?size=10&q=lab*",
  "prev": "https://example.org/v1/heritage-objects/page/1?size=10&q=lab*",
  "startIndex": 20,
  "orderedItems": [
    {
      "id": "https://example.org/v1/heritage-objects/{id}",
      "type": ["CreativeWork", "Painting"],
      "name": "Fysisch laboratorium Utrecht 1896",
      "creator": [
        {
          "id": "https://example.org/v1/persons/{id}",
          "type": "Person",
          "name": "John Doe"
        }
      ]
      // ... other properties (see the response of endpoint "Get a single heritage object")
    },
    {
      // ... other items
    }
  ]
}
```

Design decisions:

1. The endpoint returns all properties of all items, both required and optional properties, according to [SCHEMA-AP-NDE](https://docs.nde.nl/schema-profile/). Revisit this decision if there are functional and/or technical reasons (e.g. over-fetching, performance).
1. The endpoint supports all properties for filtering, both required and optional properties.
1. There is no query syntax standard for denoting the `q`, only de facto ones. For now the API supports parts of the [simple query string syntax](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-simple-query-string-query#simple-query-string-syntax) of Elasticsearch, notably the wildcard (`*`)
1. The API does not have a dedicated `/search` and `/autocomplete` endpoint - the regular 'list' endpoint can be used. Revisit this decision if there are functional and/or technical reasons.

> [!NOTE]
> To do:
>
> 1. Add filters to the request
> 1. Add sort options to the request
> 1. Add an option for hit highlighting to the request
> 1. Add facets/aggregations to the response

### Get a single heritage object

#### Request

`GET /v1/heritage-objects/{id}`

#### Response

##### Example body

```json
{
  "id": "https://example.org/v1/heritage-objects/{id}",
  "type": ["CreativeWork", "Painting"],
  "additionalType": [
    {
      "id": "https://example.org/v1/terms/{id}",
      "type": "DefinedTerm",
      "name": "fotoafdruk zwart-wit"
    }
  ],
  "name": "Fysisch laboratorium Utrecht 1896",
  "creator": [
    {
      "id": "https://example.org/v1/persons/{id}",
      "type": "Person",
      "name": "John Doe"
    }
  ],
  "associatedMedia": [
    {
      "id": "https://example.org/v1/media-objects/{id}",
      "type": ["MediaObject", "ImageObject"],
      "license": {
        "id": "https://example.org/v1/licenses/{id}",
        "name": "Creative Commons: publieke domein"
      },
      "contentUrl": "https://collections.uu.nl/IIIF/33832/full/max/0/default.jpg",
      "thumbnailUrl": "https://collections.uu.nl/IIIF/33832/full/!512,512/0/default.jpg"
    }
  ],
  "description": "Zwart-wit foto van een kamer in het fysisch laboratorium te Utrecht, met rechts de amanuensis dhr. Marinus Pieter Filbri, in het midden de toen nog assistent Van Huffel en links de instrumentmaker G. Koolschijn, Utrecht, 1896.",
  "dateCreated": "1896",
  "genre": [
    {
      "id": "https://example.org/v1/terms/{id}",
      "type": "DefinedTerm",
      "name": "natuurwetenschappen"
    }
  ],
  "material": [
    {
      "id": "https://example.org/v1/terms/{id}",
      "type": "DefinedTerm",
      "name": "papier"
    }
  ],
  "locationCreated": [
    {
      "id": "https://example.org/v1/places/{id}",
      "type": "Place",
      "name": "Physisch Laboratorium"
    }
  ],
  "contentLocation": [
    {
      "id": "https://example.org/v1/places/{id}",
      "type": "Place",
      "name": "Physisch Laboratorium"
    }
  ],
  "temporalCoverage": "1896",
  "size": "74 × 92 cm",
  "text": "Zwart-wit foto van een kamer in het fysisch laboratorium te Utrecht",
  "isPartOf": {
    "id": "https://example.org/v1/datasets/{id}",
    "type": "Dataset",
    "name": "Example Dataset",
    "publisher": {
      "id": "https://example.org/v1/organizations/{id}",
      "type": "Organization",
      "name": "Example Museum"
    },
    "license": {
      "id": "https://example.org/v1/licenses/{id}",
      "type": "CreativeWork",
      "name": "Creative Commons: publieke domein"
    }
  },
  "sdDatePublished": "2026-04-08T13:35:03Z",
  "isBasedOn": {
    "id": "https://n2t.net/ark:/40020/collect100",
    "type": "CreativeWork"
  }
}
```

### Get a single place

#### Request

`GET /v1/places/{id}`

#### Response

##### Example body

```json
{
  "id": "https://example.org/v1/places/{id}",
  "type": "Place",
  "name": "Physisch Laboratorium",
  "address": {
    "type": "PostalAddress",
    "streetAddress": "Bijlhouwerstraat 6",
    "postalCode": "3511 ZC",
    "addressLocality": "Utrecht",
    "addressRegion": "Utrecht",
    "addressCountry": "NL"
  },
  "geo": {
    "type": "GeoCoordinates",
    "latitude": 52.0815523,
    "longitude": 5.1203423
  }
}
```

### Get a single organization

#### Request

`GET /v1/organizations/{id}`

#### Response

##### Example body

```json
{
  "id": "https://example.org/v1/organizations/{id}",
  "type": "Organization",
  "name": "Example Museum",
  "location": {
    "id": "https://example.org/v1/places/{id}",
    "type": "Place",
    "name": "Office location"
  }
}
```

### Get a single person

#### Request

`GET /v1/persons/{id}`

#### Response

##### Example body

```json
{
  "id": "https://example.org/v1/persons/{id}",
  "type": "Person",
  "name": "John Doe",
  "birthPlace": {
    "id": "https://example.org/v1/places/{id}",
    "type": "Place",
    "name": "Utrecht"
  },
  "birthDate": "1871-01-01",
  "deathPlace": {
    "id": "https://example.org/v1/places/{id}",
    "type": "Place",
    "name": "Amsterdam"
  },
  "deathDate": "1941-12-31",
  "hasOccupation": [
    {
      "id": "https://example.org/v1/occupations/{id}",
      "type": "Occupation",
      "name": "Carpenter"
    }
  ]
}
```

### Get a single occupation

#### Request

`GET /v1/occupations/{id}`

#### Response

##### Example body

```json
{
  "id": "https://example.org/v1/occupations/{id}",
  "type": "Occupation",
  "name": "Carpenter"
}
```

### Get a single media object

#### Request

`GET /v1/media-objects/{id}`

#### Response

##### Example body

```json
{
  "id": "https://example.org/v1/media-objects/{id}",
  "type": ["MediaObject", "ImageObject"],
  "license": {
    "id": "https://example.org/v1/licenses/{id}",
    "type": "CreativeWork",
    "name": "Creative Commons: publieke domein"
  },
  "copyrightNotice": "© 2025 Example Museum, with permission from Ph. Otographer",
  "contentUrl": "https://collections.uu.nl/IIIF/33832/full/max/0/default.jpg",
  "thumbnailUrl": "https://collections.uu.nl/IIIF/33832/full/!512,512/0/default.jpg",
  "isBasedOn": {
    "id": "https://collections.uu.nl/IIIF/33832",
    "encodingFormat": "application/ld+json;profile='http://iiif.io/api/image/3/context.json'"
  }
}
```

### Get a single license

#### Request

`GET /v1/licenses/{id}`

#### Response

##### Example body

```json
{
  "id": "https://example.org/v1/licenses/{id}",
  "type": "CreativeWork",
  "name": "Creative Commons: publieke domein",
  "isBasedOn": {
    "id": "https://creativecommons.org/public-domain/cc0/",
    "type": "CreativeWork"
  }
}
```

### Get a single term

#### Request

`GET /v1/terms/{id}`

#### Response

##### Example body

```json
{
  "id": "https://example.org/v1/terms/{id}",
  "type": "DefinedTerm",
  "name": "fotoafdruk zwart-wit"
}
```

### Get a single dataset

#### Request

`GET /v1/datasets/{id}`

#### Response

##### Example body

```json
{
  "id": "https://example.org/v1/datasets/{id}",
  "type": "Dataset",
  "name": "Example Dataset",
  "publisher": {
    "id": "https://example.org/v1/organizations/{id}",
    "type": "Organization",
    "name": "Example Museum"
  },
  "license": {
    "id": "https://example.org/v1/licenses/{id}",
    "type": "CreativeWork",
    "name": "Creative Commons: publieke domein"
  }
}
```

### Get the JSON-LD context

#### Request

`GET https://example.org/v1/context`

##### Headers

| Name   | Value                                      |
| ------ | ------------------------------------------ |
| Accept | `application/ld+json,application/json,*/*` |

#### Response

##### Headers

| Name         | Value                 |
| ------------ | --------------------- |
| Status       | `200 OK`              |
| Content-Type | `application/ld+json` |

##### Example body

```json
{
  "@context": {
    "@version": 1.1,
    "@import": "https://schema.org/docs/jsonldcontext.jsonld",
    "@vocab": "https://schema.org/",
    "type": "@type",
    "id": "@id"
  }
}
```
