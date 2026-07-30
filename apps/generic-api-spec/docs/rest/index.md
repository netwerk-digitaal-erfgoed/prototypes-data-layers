# REST API

## Introduction

This specification defines how data layers and presentation layers exchange information using REST.

The specification is generic: it defines general concepts, data models and endpoints without assuming a specific implementation. Data layer developers can implement relevant portions of the specification and publish their own API specifications accordingly.

## Design considerations

The specification follows these considerations:

1. **Use standard REST patterns**. The specification leverages common RESTful practices to simplify API development and consumption.
2. **Adhere to Dutch government rules**. The specification adheres to the [REST API Design Rules](https://logius-standaarden.github.io/API-Design-Rules/) of the Dutch government to improve developer experience and interoperability.
3. **Build on existing standards**. The specification builds on existing data models and API specifications in the digital heritage ecosystem, like [Activity Streams](https://www.w3.org/TR/activitystreams-core/), [IIIF APIs](https://iiif.io/api/), and [Linked Art Search API](https://linked.art/api/1.0/search/).
4. **Support the goal of the NDE**. The specification makes specific choices to support the goal of the NDE: making digital heritage more accessible to end users. To reach this goal, the specification is tailored to facilitate the use of heritage information in presentation layers.

## Capability discovery and compliance levels

> [!NOTE]
> **To do**:
>
> - Explain that the API specification uses capability discovery patterns; it makes API implementations dynamic and self-documenting. This is essential for a generic, extensible specification that can be used by all sorts of data layers.
> - Specify the root endpoint of the API, e.g. `/v1`. This endpoint allows presentation layers to discover the entry points and capabilities of the API (e.g. `/v1/entities`, `/v1/collections`).
> - Specify how a data layer can extend the capabilities of its API using the patterns in the specification, e.g. with custom functionality or resources. Add examples.
> - Add a capability discovery field to the root endpoint (e.g. `/v1`) and - optionally - to each relevant resource (e.g. `/v1/collections/masterpieces`)? This allows presentation layers to detect which functionality from this specification a data layer has implemented, possibly per resource. For example:

```json
{
  "id": "https://example.org/v1/collections/masterpieces",
  "type": "HeritageCollection",
  "name": "Masterpieces",
  "conformsTo": [
    "https://specs.nde.nl/rest/v1/cursor-pagination",
    "https://specs.nde.nl/rest/v1/keyword-search",
    "https://specs.nde.nl/rest/v1/filtering",
    "https://specs.nde.nl/rest/v1/facets",
    "https://specs.nde.nl/rest/v1/suggestions",
    "https://specs.nde.nl/rest/v1/highlighting",
    "https://specs.example.org/v1/custom-functionality"
  ]
}
```

> [!NOTE]
> **To do**: explain the compliance levels that make clear to presentation layers to what extend a data layer follows these API specifications. For example, per IIIF:
>
> - Level 0: the API implements the **minimum set** of parameters and features;
> - Level 1: the API implements the **recommended set** of parameters and features;
> - Level 2: the API implements the **full set** of parameters and features.

## A note about examples

Various examples in this specification illustrate how the concepts and endpoints work. These examples assume a data layer API lives at `https://example.org/` and uses version `1`.
