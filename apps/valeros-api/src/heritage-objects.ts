import { sValidator } from "@hono/standard-validator";
import { search, SearchResult } from "@repo/typesense/heritage-objects";
import { Context, Hono } from "hono";
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

function buildFilter(filters: string[]) {
  let filter: string | undefined;
  const internalFilters: string[] = [];

  for (const filter of filters) {
    // Keep only filters of format `key:value`, e.g. `dateCreated:=1900` or `dateCreated:>1900`
    const [key, value] = filter.split(":", 2);
    if (!key || !value) {
      continue; // Undefined or empty
    }

    // Translate external keys (e.g. `dateCreated`) to internal keys (e.g. `date_created`)
    facets.forEach((externalName, internalName) => {
      if (key === externalName) {
        internalFilters.push(`${internalName}:${value}`);
      }
    });
  }

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
    q: query.q,
    sort: query.sort,
    filter: buildFilter(query.filter),
  });

  const response = buildCollectionResponse(c, query, searchResult);

  return c.json(response);
});

function buildCollectionResponse(
  c: Context<Env>,
  query: CollectionQuery,
  searchResult: SearchResult,
) {
  const baseUri = new URL(c.req.url).origin + "/v1";
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
      page: params.page,
      size: query.size,
      q: query.q,
      sort: query.sort,
      filter: buildFilter(query.filter),
    });

    const response = buildPagedCollectionResponse(c, query, searchResult);

    return c.json(response);
  },
);

function buildPagedCollectionResponse(
  c: Context<Env>,
  query: PagedCollectionQuery,
  searchResult: SearchResult,
) {
  const baseUri = new URL(c.req.url).origin + "/v1";
  const queryString = buildQueryString(query);
  const navPages = getNavPages(baseUri, queryString, searchResult);

  const response = {
    id: navPages.get("current"),
    type: "OrderedCollectionPage",
    next: navPages.get("next"),
    prev: navPages.get("prev"),
    orderedItems: searchResult.hits.map((hit) => ({
      id: `${baseUri}/heritage-objects/${hit.document.id}`,
      type: hit.document.type,
      name: hit.document.name,
      description: hit.document.description,
      dateCreated: hit.document.date_created,
      additionalType: hit.document.additional_types?.map((type) => ({
        id: `${baseUri}/terms/${type.id}`,
        type: type.type,
        name: type.name,
      })),
      creator: hit.document.creators?.map((creator) => ({
        id: `${baseUri}/persons/${creator.id}`,
        type: creator.type,
        name: creator.name,
      })),
      genre: hit.document.genres?.map((genre) => ({
        id: `${baseUri}/terms/${genre.id}`,
        type: genre.type,
        name: genre.name,
      })),
      contentLocation: hit.document.content_locations?.map((location) => ({
        id: `${baseUri}/places/${location.id}`,
        type: location.type,
        name: location.name,
      })),
      material: hit.document.materials?.map((material) => ({
        id: `${baseUri}/terms/${material.id}`,
        type: material.type,
        name: material.name,
      })),
      about: hit.document.subjects?.map((subject) => ({
        // TBD: a subject can also refer to a person or a creative work, not just a term
        id: `${baseUri}/terms/${subject.id}`,
        type: subject.type,
        name: subject.name,
      })),
      associatedMedia: hit.document.media_objects?.map((mediaObject) => ({
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
        id: `${baseUri}/datasets/${hit.document.datasets.id}`,
        type: hit.document.datasets.type,
        name: hit.document.datasets.name,
        publisher: {
          id: `${baseUri}/organizations/${hit.document.publishers.id}`,
          type: hit.document.publishers.type,
          name: hit.document.publishers.name,
        },
        license: {
          id: `${baseUri}/licenses/${hit.document.licenses.id}`,
          type: hit.document.licenses.type,
          name: hit.document.licenses.name,
        },
      },
      isBasedOn: hit.document.is_based_on,
    })),
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

export default app;
