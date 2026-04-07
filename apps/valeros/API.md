# API specification

> [!WARNING]
> This is work in progress, for illustration and discussion. It has no official standing.

## Contents

- [About the API](#about-the-api)
- [Alignment with other API specifications](#alignment-with-other-api-specifications)
- [Authentication](#authentication)
- [Versioning](#versioning)
- [Errors](#errors)
- [Metadata record types](#metadata-record-types)
- [Endpoints](#endpoints)
  - [List the metadata records of heritage objects in a paged collection](#list-the-metadata-records-of-heritage-objects-in-a-paged-collection)
  - [Get the metadata record of a heritage object](#get-the-metadata-record-of-a-heritage-object)
  - [Get the metadata record of a place](#get-the-metadata-record-of-a-place)
  - [Get the metadata record of a term](#get-the-metadata-record-of-a-term)
  - [Get the metadata record of a person](#get-the-metadata-record-of-a-person)
  - [Get the metadata record of an image](#get-the-metadata-record-of-an-image)
  - [Get the JSON-LD context](#get-the-json-ld-context)
- [To discuss](#to-discuss)

## About the API

1. The API uses REST as its architectural style
1. The API uses [JSON-LD 1.1](https://www.w3.org/TR/json-ld/) as method for serializing data
1. The API primarily uses [SCHEMA-AP-NDE](https://docs.nde.nl/schema-profile/) as its data model, and parts of [Activity Streams](https://www.w3.org/TR/activitystreams-core/)

## Alignment with other API specifications

The API is *not* yet aligned with existing API specifications, such as:

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

This is version `1.0.0` of the API.

## Errors

The API uses common HTTP status codes: `2xx` for success, `4xx` for errors caused by the caller and `5xx` for server errors. The table underneath lists the most common errors that can occur:

| Status | Description                       |
| ------ | --------------------------------- |
| `400`  | The request is invalid            |
| `404`  | The resource does not exist       |
| `415`  | The content type is not supported |
| `500`  | A server error has occurred       |
| `503`  | The server is under maintenance   |

## Metadata record types

The API supports the following metadata record types:

1. Heritage objects
1. Places
1. Persons
1. Images
1. Terms

## Endpoints

### List the metadata records of heritage objects in a paged collection

`GET /v1/heritage-objects/page/{page}?size={size}&q={q}`

##### Headers

| Name            | Value                                      |
| --------------- | ------------------------------------------ |
| Accept          | `application/ld+json,application/json,*/*` |
| Accept-Language | `nl`                                       |

#### Response

##### Headers

| Name             | Value                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Status           | `200 OK`                                                                                                    |
| Content-Type     | `application/json`                                                                                          |
| Content-Language | `nl`                                                                                                        |
| Link             | `<https://example.org/v1/contexts>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"` |

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
      "type": "CreativeWork",
      "name": "Fysisch laboratorium Utrecht 1896",
      "description": "Zwart-wit foto van een kamer in het fysisch laboratorium te Utrecht, met rechts de amanuensis dhr. Marinus Pieter Filbri, in het midden de toen nog assistent Van Huffel en links de instrumentmaker G. Koolschijn, Utrecht, 1896.",
      "associatedMedia": [
        {
          "id": "https://example.org/v1/images/{id}",
          "type": "ImageObject",
          "contentUrl": "https://collections.uu.nl/IIIF/33832/full/max/0/default.jpg",
          "thumbnailUrl": "https://collections.uu.nl/IIIF/33832/full/!512,512/0/default.jpg"
        }
      ]
      // ... other properties (TBD)
    },
    {
      // ... other items
    }
  ]
}
```

> [!IMPORTANT]
> TBD:
>
> - Add facets/aggregations to the response
> - Add sort options
> - Decide upon the properties per metadata record that must be returned in the response
> - Add filters to the request (and turn it into a full `/search` endpoint, with a `POST`)?
> - Can this endpoint be used for autocompletion? Or is an explicit `/autocomplete` necessary (e.g. different parameters, different response)?
> - Is there a query syntax standard that we can use (e.g. wildcards)?

### Get the metadata record of a heritage object

#### Request

`GET /v1/heritage-objects/{id}`

##### Headers

| Name            | Value                                      |
| --------------- | ------------------------------------------ |
| Accept          | `application/ld+json,application/json,*/*` |
| Accept-Language | `nl`                                       |

#### Response

##### Headers

| Name             | Value                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Status           | `200 OK`                                                                                                    |
| Content-Type     | `application/json`                                                                                          |
| Content-Language | `nl`                                                                                                        |
| Link             | `<https://example.org/v1/contexts>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"` |

##### Example body

```json
{
  "id": "https://example.org/v1/heritage-objects/{id}",
  "type": "CreativeWork",
  "additionalType": [
    {
      "id": "https://example.org/v1/terms/{id}",
      "type": "DefinedTerm",
      "name": "fotoafdruk zwart-wit"
    }
  ],
  "name": "Fysisch laboratorium Utrecht 1896",
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
  "creator": [
    {
      "id": "https://example.org/v1/persons/{id}",
      "type": "Person",
      "name": "John Doe"
    }
  ],
  "locationCreated": [
    {
      "id": "https://example.org/v1/places/{id}",
      "type": "Place",
      "name": "Physisch Laboratorium"
    }
  ],
  "associatedMedia": [
    {
      "id": "https://example.org/v1/images/{id}",
      "type": "ImageObject",
      "contentUrl": "https://collections.uu.nl/IIIF/33832/full/max/0/default.jpg",
      "thumbnailUrl": "https://collections.uu.nl/IIIF/33832/full/!512,512/0/default.jpg"
    }
  ],
  "isBasedOn": "https://n2t.net/ark:/40020/collect100"
}
```

### Get the metadata record of a place

#### Request

`GET /v1/places/{id}`

##### Headers

| Name            | Value                                      |
| --------------- | ------------------------------------------ |
| Accept          | `application/ld+json,application/json,*/*` |
| Accept-Language | `nl`                                       |

#### Response

##### Headers

| Name             | Value                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Status           | `200 OK`                                                                                                    |
| Content-Type     | `application/json`                                                                                          |
| Content-Language | `nl`                                                                                                        |
| Link             | `<https://example.org/v1/contexts>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"` |

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

### Get the metadata record of a person

#### Request

`GET /v1/persons/{id}`

##### Headers

| Name            | Value                                      |
| --------------- | ------------------------------------------ |
| Accept          | `application/ld+json,application/json,*/*` |
| Accept-Language | `nl`                                       |

#### Response

##### Headers

| Name             | Value                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Status           | `200 OK`                                                                                                    |
| Content-Type     | `application/json`                                                                                          |
| Content-Language | `nl`                                                                                                        |
| Link             | `<https://example.org/v1/contexts>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"` |

##### Example body

```json
{
  "id": "https://example.org/v1/persons/{id}",
  "type": "Person",
  "name": "John Doe"
}
```

### Get the metadata record of an image

#### Request

`GET /v1/images/{id}`

##### Headers

| Name            | Value                                      |
| --------------- | ------------------------------------------ |
| Accept          | `application/ld+json,application/json,*/*` |
| Accept-Language | `nl`                                       |

#### Response

##### Headers

| Name             | Value                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Status           | `200 OK`                                                                                                    |
| Content-Type     | `application/json`                                                                                          |
| Content-Language | `nl`                                                                                                        |
| Link             | `<https://example.org/v1/contexts>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"` |

##### Example body

```json
{
  "id": "https://example.org/v1/images/{id}",
  "type": "ImageObject",
  "contentUrl": "https://collections.uu.nl/IIIF/33832/full/max/0/default.jpg",
  "thumbnailUrl": "https://collections.uu.nl/IIIF/33832/full/!512,512/0/default.jpg"
}
```

### Get the metadata record of a term

#### Request

`GET /v1/terms/{id}`

##### Headers

| Name            | Value                                      |
| --------------- | ------------------------------------------ |
| Accept          | `application/ld+json,application/json,*/*` |
| Accept-Language | `nl`                                       |

#### Response

##### Headers

| Name             | Value                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Status           | `200 OK`                                                                                                    |
| Content-Type     | `application/json`                                                                                          |
| Content-Language | `nl`                                                                                                        |
| Link             | `<https://example.org/v1/contexts>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"` |

##### Example body

```json
{
  "id": "https://example.org/v1/terms/{id}",
  "type": "DefinedTerm",
  "name": "fotoafdruk zwart-wit"
}
```

### Get the JSON-LD context

#### Request

`GET https://example.org/v1/contexts`

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

## To discuss

1. How to search for and retrieve languages of properties, e.g. "nl" or "en"? For example: send an `Accept-Language` header?
1. How to refer to the original metadata records, as provided by data providers? For example: `isBasedOn`?
1. A metadata record can have multiple primary types, e.g. `CreativeWork` _and_ `Painting`. How to handle this?
1. Is there a need to search in all metadata records in a given search action, e.g. in both heritage objects and persons? Or would a search per record type suffice?
