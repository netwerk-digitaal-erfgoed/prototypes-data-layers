# General concepts

## Introduction

An API provides an interface for presentation layers to interact with a data layer, decoupling them from specific underlying systems and technologies. To ensure consistent and predictable interactions, a data layer's API must implement several concepts.

## Documentation

The API is as good as the accompanying documentation. The documentation of the API must be easily discoverable, searchable and publicly accessible. It is often the primary resource for developers of presentation layers during implementation.

API documentation _MUST_ be provided in the form of an OpenAPI definition document which conforms to the [OpenAPI Specification](https://www.openapis.org/), version 3 or later.

See [Documentation](https://logius-standaarden.github.io/API-Design-Rules/#documentation) in the API Design Rules for more information.

## Versioning

The API may evolve over time. It _MUST_ be versioned as follows:

1. The URI base path _MUST_ include a major version number prefixed with `v`. Example: `https://example.org/v1`, `https://example.org/v2`.
2. The API _MUST_ send the full version number of the API in the `API-Version` header. Example: `API-Version: 1.2.3`, `API-Version: 2.1.0`.

### Example

An example request from a presentation layer:

```http
GET /v1/entities/objects/1234 HTTP/2
Host: example.org
```

This tells the API that the presentation layer is requesting a resource of version `1` (`v1`) of the API.

An example of the response headers of the API:

```http
HTTP/2 200 OK
API-Version: 1.2.3
```

The response indicates that the exact version of the API is `1.2.3`.

The data layer _MUST_ facilitate the transition between versions. For example, the data layer _SHOULD_ publish a deprecation schedule and a changelog.

See [Versioning](https://logius-standaarden.github.io/API-Design-Rules/#versioning) in the API Design Rules for more information.

## Status codes

The API _MUST_ use common HTTP status codes in its responses: `2xx` for success, `3xx` for redirects, `4xx` for errors caused by the presentation layer and `5xx` for errors caused by the API.

The following table lists common status codes:

| Status | Description                                                                     |
| ------ | ------------------------------------------------------------------------------- |
| `200`  | The request is valid.                                                           |
| `304`  | The requested resource is not modified.                                         |
| `400`  | The request is invalid.                                                         |
| `404`  | The requested resource does not exist.                                          |
| `406`  | The request could not be accepted according to the content negotiation headers. |
| `415`  | The media type in the request is not supported.                                 |
| `429`  | The server has received too many requests.                                      |
| `500`  | A server error has occurred.                                                    |
| `503`  | The server is under maintenance.                                                |

## Media types

The API _MUST_ use media types to enable open and extensible content negotiation.

1. A presentation layer _MAY_ send the `Accept` header in its request. Its value _MUST_ conform to the [HTTP semantics](https://www.rfc-editor.org/info/rfc9110/#section-12.5.1). For example, the value may contain a specific media type (e.g. `application/json`), a media type range (e.g. `application/json, application/problem+json`) or any media type (`*/*`).
1. If a presentation layer sends the `Accept` header with a media type the API does not support, the API _MUST_ respond with a `415 Unsupported Media Type` status code.
1. The API _MUST_ send the media type of its response in the `Content-Type` header. Its value _MUST_ conform to the [HTTP semantics](https://www.rfc-editor.org/info/rfc9110/#section-8.3).
1. The API _MUST_ send the `Vary: Accept` header to indicate to a presentation layer that it supports content negotiation for media types. This tells a presentation layer that changing the value of the `Accept` header in a request will yield a different representation of a resource.
1. The API _MUST_ send its responses as JSON; it is easy to parse and it is supported natively in most programming languages.

> [!NOTE]
> **To do**: make JSON-LD the default, not JSON.

### Example

An example request from a presentation layer:

```http
GET /v1/entities/objects/1234 HTTP/2
Host: example.org
Accept: application/json
```

This tells the API that the presentation layer prefers the response to be serialized as JSON.

An example of the response headers of the API:

```http
HTTP/2 200 OK
Content-Type: application/json
Vary: Accept
```

The response indicates that the response is serialized as JSON and that a new request to the same resource with a different `Accept` header value will result in a different representation of the resource.

## Languages

Heritage information is available in one or more languages, such as Dutch or English. The API _MUST_ allow presentation layers to request information in a preferred language, even if the API only exposes information in one language.

1. A presentation layer _MAY_ send the `Accept-Language` header in its request to indicate which language it prefers. Its value _MUST_ conform to the [HTTP semantics](https://www.rfc-editor.org/info/rfc9110/#section-12.5.4).
1. If a presentation layer sends the `Accept-Language` header with a language tag that the API does not support, the API _MUST_ respond with a `406 Not Acceptable` status code.
1. If a presentation layer does not send the `Accept-Language` header, the API _MUST_ send its content in its default language, defined by the data layer.
1. The API _MUST_ send the language tag of the content in the `Content-Language` header. Its value _MUST_ comply to the [HTTP semantics](https://www.rfc-editor.org/info/rfc9110/#section-8.5).
1. The API _MUST NOT_ serve its content in different languages in one response. Instead, a presentation layer _MUST_ issue separate requests for each language, with different `Accept-Language` header values.
1. The API _MUST_ send the `Vary: Accept-Language` header to indicate to a presentation layer that it supports content negotiation for languages. This informs a presentation layer that changing the value of the `Accept-Language` header in a request will yield a different, language-aware representation of a resource.

### Example

An example request from a presentation layer:

```http
GET /v1/entities/objects/1234 HTTP/2
Host: example.org
Accept-Language: nl
```

This tells the API that the presentation layer prefers the content to be in Dutch.

An example of the response headers of the API:

```http
HTTP/2 200 OK
Content-Language: nl
Vary: Accept-Language
```

The response indicates that the content is in Dutch and that a new request to the same resource with a different `Accept-Language` header value will result in a different representation of the resource.

## Caching

Caching is a mechanism where presentation layers store responses from the API to reuse them for subsequent requests. The API _SHOULD_ support caching via HTTP headers; it enhances performance by reducing server load and latency. This section lists the primary requirements — see [HTTP Caching](https://www.rfc-editor.org/info/rfc9111) for more information.

1. The API _SHOULD_ send the `Cache-Control` header, to make clear to a presentation layer whether information can be cached and, if so, for how long (e.g. 1 hour, 1 day or 1 week). Its value _MUST_ conform to the [HTTP Caching standard](https://www.rfc-editor.org/info/rfc9111/#section-5.2).
1. The API _SHOULD_ send the `ETag` header with a unique fingerprint of a resource. When the resource changes, the API _MUST_ change its fingerprint.
1. A presentation layer _MAY_ send the `If-None-Match` header in its request with one or more ETag values returned by the API. If the resource still has one of the provided ETags, the API _MUST_ respond with the `304 Not Modified` status code. If, however, the resource has another ETag, the API _MUST_ return the new resource with a new fingerprint in the `ETag` header.
1. The API _SHOULD_ send the `Last-Modified` header with a timestamp of when the resource was last modified. Its value _MUST_ conform to the [HTTP semantics](https://www.rfc-editor.org/info/rfc9110/#section-8.8.2).
1. A presentation layer _MAY_ send the `If-Modified-Since` header in its request. If the resource has not been modified since that time, the API _MUST_ respond with a `304 Not Modified` status code. Otherwise, the API _MUST_ return the new resource and update the `Last-Modified` header.
1. If a presentation layer sends both the `If-None-Match` and `If-Modified-Since` headers in the same request, the API _MUST_ accept `If-None-Match` and ignore `If-Modified-Since`.

### Example

An example of the response headers of the API:

```http
HTTP/2 200 OK
Cache-Control: max-age=3600
ETag: "xyz"
Last-Modified: Tue, 16 July 2026 04:58:08 GMT
```

The response indicates that this resource can be cached for 1 hour (`max-age=3600`) without checking the API, has ETag `xyz`, and was last modified on Thursday 16 July 2026.

## Rate limiting

Rate limiting is a traffic control mechanism that caps the number of requests a presentation layer can make to the API within a specific timeframe. It protects the data layer's infrastructure from overload and abuse. See [Retry-After](https://www.rfc-editor.org/info/rfc9110/#name-retry-after) and [RateLimit Header Fields for HTTP](https://www.ietf.org/archive/id/draft-polli-ratelimit-headers-02.html) for more information.

1. The API _SHOULD_ support rate limiting. The data layer chooses a strategy that best fits its situation. For example, the data layer may choose a rate limiting algorithm such as Token Bucket, Fixed Window Counter or Sliding Window. The data layer may also choose a method for identifying presentation layers, for example based on the IP address or the `User-Agent` header.
1. The API _SHOULD_ send the `RateLimit-Limit` header to indicate the requests quota in the current timeframe.
1. The API _SHOULD_ send the `RateLimit-Remaining` header to indicate the remaining requests quota in the current timeframe.
1. The API _SHOULD_ send the `RateLimit-Reset` header to indicate how much time remains in the current timeframe before the request quota is reset.
1. The API _SHOULD_ send a `429 Too Many Requests` status code if a presentation layer has sent too many requests within the current timeframe.
1. The API _SHOULD_ send the `Retry-After` header if a presentation layer has sent too many requests within the current timeframe, to indicate how long the presentation layer ought to wait before making a new request.

### Example

An example of the response headers of the API when no rate limit has been reached:

```http
HTTP/2 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 75
RateLimit-Reset: 60
```

The response indicates that it can send up to 100 requests in the current timeframe, that it already has sent 25 requests and that 75 are remaining, and that the rate limit will be reset in 60 seconds.

An example of the response headers of the API when a rate limit has been reached:

```http
HTTP/2 429 Too Many Requests
Retry-After: 120
```

The response indicates that it has made too many requests and that it can try again after 120 seconds.

## Cross-Origin Resource Sharing (CORS)

Cross-Origin Resource Sharing (CORS) is a mechanism that allows browser-based presentation layers to interact with the API. The API _MUST_ support CORS by following the relevant requirements of the [CORS specification](https://www.w3.org/TR/cors/). This section lists the primary requirements.

1. A presentation layer _MUST_ send the `Origin` header to indicate the origin (scheme, hostname, and optionally port) that caused the request to the API.
1. The API _MUST_ respond with a `400 Bad Request` status code if the `Origin` header in the request is missing or invalid.
1. The API _MUST_ send the `Access-Control-Allow-Origin` header. The value _SHOULD_ be `*` to allow access to the API from any origin. If the API [limits access](#open-access) (e.g. via the `Authorization` header), a specific origin _MUST_ be provided instead of `*`, and the `Access-Control-Allow-Credentials: true` header _MUST_ be send.
1. If the API sends a response with an `Access-Control-Allow-Origin` value with an explicit origin (rather than the `*` wildcard), the API _MUST_ also send the `Vary: Origin` header to indicate to a presentation layer that responses can differ based on the value of the `Origin` request header.
1. The API _MUST_ send the `Access-Control-Allow-Methods` header to specify which HTTP methods are permitted for cross-origin requests.
1. The API _MUST_ send the `Access-Control-Allow-Headers` header to specify which HTTP headers are permitted for cross-origin requests.
1. The API _MUST_ support the HTTP `OPTIONS` method and send the headers above in response to an `OPTIONS` request (the [preflight request pattern](https://fetch.spec.whatwg.org/#cors-preflight-request)).

### Example

Here's how the preflight request of a presentation layer might look like:

```http
OPTIONS /v1/entities/objects/1234 HTTP/2
Host: example.org
Origin: https://mywebsite.nl
Access-Control-Request-Method: GET
Access-Control-Request-Headers: Accept, Accept-Language, If-None-Match, If-Modified-Since, Origin
```

Here's how the preflight response headers of the API might look like:

```http
HTTP/2 200 OK
Content-Length: 0
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Accept, Accept-Language, If-None-Match, If-Modified-Since, Origin
Access-Control-Max-Age: 7200
```

Here's how the regular, non-preflight request of a presentation layer might look like:

```http
GET /v1/entities/objects/1234 HTTP/2
Host: example.org
Origin: https://mywebsite.nl
```

Here's how the regular, non-preflight response headers of the API might look like:

```http
HTTP/2 200 OK
Access-Control-Allow-Origin: *
```

## Error handling

When an error occurs, the API _MUST_ handle errors as follows:

1. The API _MUST_ return an appropriate HTTP status code, such as `404` or `500`.
1. The API _MUST_ return error information according to [Problem Details for HTTP APIs](https://www.rfc-editor.org/info/rfc9457/). The error information _MUST_ contain at least the following fields:

| Name     | Data type | Cardinality | Description                                                                                                                                       |
| -------- | --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status` | number    | 1           | The HTTP status code. Example: `400`, `404`, `500`.                                                                                               |
| `title`  | string    | 1           | A short, human-readable summary of the problem type. For example: `Resource not found` for every resource that could not be retrieved by the API. |
| `detail` | string    | 1           | A human-readable explanation specific to this occurrence of the problem.                                                                          |

> [!NOTE]
> **To be discussed**: add support for the [type field](https://www.rfc-editor.org/info/rfc9457/#name-type), for machine-readable processing?

### Example

An example of the response headers of the API:

```http
HTTP/2 404 Not Found
Content-Type: application/problem+json
Content-Language: en
```

Note that the API has responded with the `application/problem+json` media type, even though the presentation layer may not have listed it in its `Accept` header. This is allowed by the [HTTP Semantics](https://www.rfc-editor.org/info/rfc9110/#field.accept). Also note the `Content-Language` header, to make clear that the content is in a particular language, per the `Accept-Language` header of the presentation layer or, if that header was not provided, the default language of the API.

An example of the response body of the API:

```json
{
  "status": 404,
  "title": "Resource not found",
  "detail": "No heritage object found with ID 1234"
}
```

Note that the `title` is generic (it applies to every resource) and that the `detail` is specific (it applies to a particular resource with a particular ID).

## Open access

The API _SHOULD_ be open to any presentation layer without technical constraints, such as authentication (e.g. via the `Authorization` header) or IP address filtering.

Access should only be restricted to designated presentation layers under specific circumstances, such as legal requirements. This specification does not dictate which technical constraints a data layer should implement; that decision rests with the data layer based on its specific needs.

## Client identification

The data layer should be able to monitor the usage of its API and advise presentation layers in optimizing their implementations. The data layer should therefore be able to identify individual presentation layers.

1. A presentation layer _SHOULD_ send the `User-Agent` header in its requests. The header value _SHOULD_ consist of the name of the system of the presentation layer, the version of its system and the URL of the owner of the presentation layer. The value _SHOULD_ look like this: `system/version (url)`, e.g. `MyApp/1.7.6 (https://mymuseum.nl)`. See the [HTTP semantics](https://www.rfc-editor.org/info/rfc9110/#field.user-agent) for more information.
1. The API _MAY_ respond with a `400 Bad Request` status code if the `User-Agent` header in the request is missing or its value is invalid.

### Example

An example request from a presentation layer:

```http
GET /v1/entities/objects/1234 HTTP/2
Host: example.org
User-Agent: MyApp/1.7.6 (https://mymuseum.nl)
```

This tells the API that the request comes from system `MyApp`, version `1.7.6`, operated by a presentation layer with URL `https://mymuseum.nl`.
