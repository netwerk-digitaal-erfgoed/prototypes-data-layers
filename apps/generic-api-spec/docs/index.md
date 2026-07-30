# API Specifications

> [!WARNING]
> **Work in progress** — this document is for illustration and discussion only. It has no official standing.

> [!NOTE]
> **To do**:
>
> - Add references to the [gedragsprofielen digitaal erfgoed](https://zenodo.org/records/14938780).
> - Make a clean separation between the specification of the interface and the behaviour of the data layer (what it must or should do).
> - Include a 'Metamodel Informatiemodellering' (MIM), explaining the information model on which the API is grounded.

## Introduction

This document defines API specifications for the exchange of heritage information between data layers and presentation layers within the [Dutch Digital Heritage Network](https://netwerkdigitaalerfgoed.nl/) (NDE). By standardizing data layer interfaces, we enable presentation layer developers to build generic API clients that are compatible with any data layer, reducing the need for custom integrations.

> [!NOTE]
> **To be discussed**: is the name _API Specifications_ a sound one? It could suggest concrete specifications, whereas they're a bit more abstract. Alternatively, _API Framework_ or _API Interoperability Framework_?

## Version

The document describes **version 0.0.1** of the API specifications.

This is the **initial development** version, version zero. Breaking changes are introduced within the same major version, following [semantic versioning for version zero](https://semver.org/#spec-item-4).

## Definitions

1. A **data layer** combines heritage information from multiple data providers and exposes it through an API for use by one or more presentation layers.
2. A **presentation layer** uses heritage information from data layers and makes it accessible to end users, e.g. via websites or mobile apps.

## Audience

This document is intended for:

1. **Data layer developers** building compliant APIs.
1. **Presentation layer developers** building generic clients that work across various data layers.

## Conformance

The keywords _MAY_, _MUST_, _MUST NOT_, _OPTIONAL_, _SHOULD_, and _SHOULD NOT_ are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt), when, and only when, they appear in all capitals, as shown here.
