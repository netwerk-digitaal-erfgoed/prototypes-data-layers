import { sValidator } from "@hono/standard-validator";
import { Document, search, SearchResult, retrieve } from "@repo/typesense/datasets";
import { Hono } from "hono";
import { z } from "zod";
import { Env } from "./env.js";

const app = new Hono<Env>();

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

  const queryString = searchParams.size > 0 ? "?" + searchParams.toString() : "";

  return queryString;
}

function getNavPages(baseUri: string, queryString: string, searchResult: SearchResult) {
  const navPages = new Map<string, string>();

  const currentPage = searchResult.page;
  const lastPage = Math.ceil(searchResult.found / searchResult.request_params.per_page);
  const nextPage = currentPage + 1;
  const prevPage = currentPage - 1;

  navPages.set("current", `${baseUri}/datasets/page/${currentPage}${queryString}`);

  if (searchResult.found > 0) {
    navPages.set("first", `${baseUri}/datasets/page/1${queryString}`);
    navPages.set("last", `${baseUri}/datasets/page/${lastPage}${queryString}`);
  }

  if (nextPage <= lastPage) {
    navPages.set("next", `${baseUri}/datasets/page/${nextPage}${queryString}`);
  }

  if (prevPage > 0) {
    navPages.set("prev", `${baseUri}/datasets/page/${prevPage}${queryString}`);
  }

  return navPages;
}

const collectionQuerySchema = z.object({
  sort: z.string().optional(),
  q: z.string().default("*"), // "All"
});

type CollectionQuery = z.output<typeof collectionQuerySchema>;

app.get("/v1/datasets", sValidator("query", collectionQuerySchema), async (c) => {
  const query = c.req.valid("query");

  const searchResult = await search({
    client: c.get("typesenseClient"),
    q: query.q,
    sort: query.sort,
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
    id: `${baseUri}/datasets${queryString}`,
    type: "OrderedCollection",
    first: navPages.get("first"),
    last: navPages.get("last"),
    totalItems: searchResult.found,
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
});

type PagedCollectionQuery = z.output<typeof pagedCollectionQuerySchema>;

app.get(
  "/v1/datasets/page/:page",
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
    });

    const baseUri = new URL(c.req.url).origin + "/v1";
    const response = buildPagedCollectionResponse(baseUri, query, searchResult);

    return c.json(response);
  },
);

function buildDocumentResponse(baseUri: string, document: Document) {
  const response = {
    id: `${baseUri}/datasets/${document.id}`,
    type: document.type,
    name: document.name,
    publisher: {
      id: `${baseUri}/organizations/${document.publishers.id}`,
      type: document.publishers.type,
      name: document.publishers.name,
    },
    license: {
      id: `${baseUri}/licenses/${document.licenses.id}`,
      type: document.licenses.type,
      name: document.licenses.name,
      isBasedOn: document.licenses?.is_based_on,
    },
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
      id: `${baseUri}/datasets${queryString}`,
      type: "OrderedCollection",
      first: navPages.get("first"),
      last: navPages.get("last"),
      totalItems: searchResult.found,
    },
  };

  return response;
}

const singleResourceParamsSchema = z.object({
  id: z.string(),
});

app.get("/v1/datasets/:id", sValidator("param", singleResourceParamsSchema), async (c) => {
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
