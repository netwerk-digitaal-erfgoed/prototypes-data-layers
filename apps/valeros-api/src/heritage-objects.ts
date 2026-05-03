import { sValidator } from "@hono/standard-validator";
import { Document, retrieve, search, SearchResult } from "@repo/typesense/heritage-objects";
import { Hono } from "hono";
import { z } from "zod";
import { Env } from "./env.js";

const app = new Hono<Env>();

// Internal search index names to external API names
const facets = new Map([
  ["additional_type", "additionalType"],
  ["content_location", "contentLocation"],
  ["creator", "creator"],
  ["dataset", "dataset"],
  ["genre", "genre"],
  ["license", "license"],
  ["material", "material"],
  ["publisher", "publisher"],
  ["subject", "subject"],
]);

const idSuffix = ".id";

function buildFilter(filters: string[]) {
  const internalFilters: string[] = [];

  for (const filter of filters) {
    // Keep only filters of format `key:value`, e.g.
    // - `dateCreated:=1900`
    // - `dateCreated:>1900`
    // - `creator:John`
    // - `creator.id:https://example.org/resource/1234`
    const separatorPosition = filter.indexOf(":");
    if (separatorPosition === -1) {
      continue; // Invalid filter; ignore
    }

    let key = filter.slice(0, separatorPosition);
    let value = filter.slice(separatorPosition + 1);
    if (key.length === 0 || value.length === 0) {
      continue; // Empty - ignore
    }

    let nestedKey = "";

    // Special case: if a key ends with `.id` (e.g. `creator.id`),
    // an 'identity filter' is given and we must filter resources
    // based on the given URI (e.g. `https://example.org/resource/1234`)
    const hasNestedIdKey = key.endsWith(idSuffix);
    if (hasNestedIdKey) {
      // Extract the ID from the URI, e.g.
      // `https://example.org/resource/1234` => `1234`
      const slashPosition = value.lastIndexOf("/");
      if (slashPosition === -1) {
        continue; // No ID found - ignore
      }

      value = value.slice(slashPosition + 1);
      if (value.length === 0) {
        continue; // No ID found - ignore
      }

      nestedKey = "_id";
      key = key.slice(0, -idSuffix.length); // Remove the `.id` suffix
    }

    // Translate external keys to internal keys,
    // e.g. from `dateCreated` to `date_created`
    facets.forEach((externalName, internalName) => {
      if (key === externalName) {
        internalFilters.push(`${internalName}${nestedKey}:${value}`);
      }
    });
  }

  let filter: string | undefined;

  if (internalFilters.length > 0) {
    // E.g. `creator:=John && date_created:>1900`
    filter = internalFilters.join(" && ");
  }

  return filter;
}

function buildQueryString(query: CollectionQuery | PagedCollectionQuery) {
  const searchParams = new URLSearchParams();

  if ("size" in query) {
    searchParams.set("size", query.size.toString());
  }

  if (query.q) {
    searchParams.set("q", query.q);
  }

  if (query.sort) {
    searchParams.set("sort", query.sort!);
  }

  if (query.filter.length > 0) {
    query.filter.map((filter) => searchParams.append("filter", filter));
  }

  const queryString = searchParams.size > 0 ? "?" + searchParams.toString() : "";

  return queryString;
}

function getNavPages(baseUri: string, queryString: string, searchResult: SearchResult) {
  const navPages = new Map<string, string>();

  const currentPage = searchResult.page;
  const lastPage = Math.ceil(searchResult.found / searchResult.request_params.per_page);
  const nextPage = currentPage + 1;
  const prevPage = currentPage - 1;

  navPages.set("current", `${baseUri}/heritage-objects/page/${currentPage}${queryString}`);

  if (searchResult.found > 0) {
    navPages.set("first", `${baseUri}/heritage-objects/page/1${queryString}`);
    navPages.set("last", `${baseUri}/heritage-objects/page/${lastPage}${queryString}`);
  }

  if (nextPage <= lastPage) {
    navPages.set("next", `${baseUri}/heritage-objects/page/${nextPage}${queryString}`);
  }

  if (prevPage > 0) {
    navPages.set("prev", `${baseUri}/heritage-objects/page/${prevPage}${queryString}`);
  }

  return navPages;
}

const collectionQuerySchema = z.object({
  sort: z.string().optional(),
  q: z.string().default("*"), // "All"
  // E.g. `["creator:John", "material:paper"]`
  filter: z.union([z.string().transform((value) => [value]), z.array(z.string())]).catch([]),
});

type CollectionQuery = z.output<typeof collectionQuerySchema>;

app.get("/v1/heritage-objects", sValidator("query", collectionQuerySchema), async (c) => {
  const query = c.req.valid("query");

  const searchResult = await search({
    client: c.get("typesenseClient"),
    q: query.q,
    sort: query.sort,
    filter: buildFilter(query.filter),
  });

  const baseUri = new URL(c.req.url).origin + "/v1";
  const response = buildCollectionResponse(baseUri, query, searchResult);

  return c.json(response);
});

function buildCollectionResponse(
  baseUri: string,
  query: CollectionQuery,
  searchResult: SearchResult,
) {
  const queryString = buildQueryString(query);
  const navPages = getNavPages(baseUri, queryString, searchResult);

  const response = {
    id: `${baseUri}/heritage-objects${queryString}`,
    type: "OrderedCollection",
    first: navPages.get("first"),
    last: navPages.get("last"),
    totalItems: searchResult.found,
    facets: searchResult.facet_counts.map((facet) => ({
      type: "OrderedCollection",
      name: facets.get(facet.field_name),
      orderedItems: facet.counts.map((facetCounts) => ({
        type: "FacetValue",
        value: facetCounts.value,
        count: facetCounts.count,
      })),
    })),
  };

  return response;
}

const pagedCollectionParamsSchema = z.object({
  page: z.coerce.number().min(1).catch(1),
});

const pagedCollectionQuerySchema = z.object({
  size: z.coerce.number().min(1).max(100).catch(10),
  sort: z.string().optional(),
  q: z.string().default("*"), // "All"
  // E.g. `["creator:John", "material:paper"]`
  filter: z.union([z.string().transform((value) => [value]), z.array(z.string())]).catch([]),
});

type PagedCollectionQuery = z.output<typeof pagedCollectionQuerySchema>;

app.get(
  "/v1/heritage-objects/page/:page",
  sValidator("param", pagedCollectionParamsSchema),
  sValidator("query", pagedCollectionQuerySchema),
  async (c) => {
    const params = c.req.valid("param");
    const query = c.req.valid("query");

    const searchResult = await search({
      client: c.get("typesenseClient"),
      page: params.page,
      size: query.size,
      q: query.q,
      sort: query.sort,
      filter: buildFilter(query.filter),
    });

    const baseUri = new URL(c.req.url).origin + "/v1";
    const response = buildPagedCollectionResponse(baseUri, query, searchResult);

    return c.json(response);
  },
);

function buildDocumentResponse(baseUri: string, document: Document) {
  const response = {
    id: `${baseUri}/heritage-objects/${document.id}`,
    type: document.type,
    name: document.name,
    description: document.description,
    dateCreated: document.date_created,
    additionalType: document.additional_types?.map((type) => ({
      id: `${baseUri}/terms/${type.id}`,
      type: type.type,
      name: type.name,
    })),
    creator: document.creators?.map((creator) => ({
      // TODO: a creator can also refer to an organization, not just a person
      id: `${baseUri}/persons/${creator.id}`,
      type: creator.type,
      name: creator.name,
    })),
    genre: document.genres?.map((genre) => ({
      id: `${baseUri}/terms/${genre.id}`,
      type: genre.type,
      name: genre.name,
    })),
    contentLocation: document.content_locations?.map((location) => ({
      id: `${baseUri}/places/${location.id}`,
      type: location.type,
      name: location.name,
    })),
    material: document.materials?.map((material) => ({
      id: `${baseUri}/terms/${material.id}`,
      type: material.type,
      name: material.name,
    })),
    about: document.subjects?.map((subject) => ({
      // TODO: a subject can also refer to e.g. a person or a creative work, not just a term
      id: `${baseUri}/terms/${subject.id}`,
      type: subject.type,
      name: subject.name,
    })),
    associatedMedia: document.media_objects?.map((mediaObject) => ({
      id: `${baseUri}/media-objects/${mediaObject.id}`,
      type: mediaObject.type,
      contentUrl: mediaObject.content_url,
      thumbnailUrl: mediaObject.thumbnail_url,
      isBasedOn: {
        id: mediaObject.is_based_on?.id,
        encodingFormat: mediaObject.is_based_on?.encoding_format,
      },
      license: {
        id: `${baseUri}/licenses/${mediaObject.licenses.id}`,
        name: mediaObject.licenses.name,
        isBasedOn: mediaObject.licenses.is_based_on,
      },
    })),
    isPartOf: {
      id: `${baseUri}/datasets/${document.datasets.id}`,
      type: document.datasets.type,
      name: document.datasets.name,
      publisher: {
        id: `${baseUri}/organizations/${document.publishers.id}`,
        type: document.publishers.type,
        name: document.publishers.name,
      },
      license: {
        id: `${baseUri}/licenses/${document.licenses.id}`,
        type: document.licenses.type,
        name: document.licenses.name,
      },
    },
    isBasedOn: document.is_based_on,
  };

  return response;
}

function buildPagedCollectionResponse(
  baseUri: string,
  query: PagedCollectionQuery,
  searchResult: SearchResult,
) {
  const queryString = buildQueryString(query);
  const navPages = getNavPages(baseUri, queryString, searchResult);

  const response = {
    id: navPages.get("current"),
    type: "OrderedCollectionPage",
    next: navPages.get("next"),
    prev: navPages.get("prev"),
    orderedItems: searchResult.hits.map((hit) => buildDocumentResponse(baseUri, hit.document)),
    partOf: {
      id: `${baseUri}/heritage-objects${queryString}`,
      type: "OrderedCollection",
      first: navPages.get("first"),
      last: navPages.get("last"),
      totalItems: searchResult.found,
      facets: searchResult.facet_counts.map((facet) => ({
        type: "OrderedCollection",
        name: facets.get(facet.field_name),
        orderedItems: facet.counts.map((facetCounts) => ({
          type: "FacetValue",
          value: facetCounts.value,
          count: facetCounts.count,
        })),
      })),
    },
  };

  return response;
}

const singleResourceParamsSchema = z.object({
  id: z.string(),
});

app.get("/v1/heritage-objects/:id", sValidator("param", singleResourceParamsSchema), async (c) => {
  const params = c.req.valid("param");

  const document = await retrieve({
    client: c.get("typesenseClient"),
    id: params.id,
  });

  if (document === undefined) {
    return c.notFound();
  }

  const baseUri = new URL(c.req.url).origin + "/v1";
  const response = buildDocumentResponse(baseUri, document);

  return c.json(response);
});

export default app;
