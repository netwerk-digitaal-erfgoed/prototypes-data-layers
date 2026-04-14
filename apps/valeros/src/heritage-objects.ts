import { sValidator } from "@hono/standard-validator";
import { search, SearchResult } from "@repo/typesense/heritage-objects";
import { Context, Hono } from "hono";
import { z } from "zod";
import { Env } from "./env.js";

const app = new Hono<Env>();

// Internal Typesense names to external API names
const facets = new Map([
  ["additional_type", "additionalType"],
  ["content_location", "contentLocation"],
  ["creator", "creator"],
  ["dataset", "dataset"],
  ["genre", "genre"],
  ["license", "license"],
  ["material", "material"],
  ["publisher", "publisher"],
]);

const paramsSchema = z.object({
  page: z.coerce.number().min(1).catch(1),
});

// type Params = z.output<typeof paramsSchema>;

const querySchema = z.object({
  size: z.coerce.number().min(1).max(100).catch(10),
  sort: z.string().optional(),
  q: z.string().default("*"), // "All"
  filter: z.union([z.string().transform((value) => [value]), z.array(z.string())]).catch([]),
});

// type Query = z.output<typeof querySchema>;

app.get(
  "/heritage-objects/page/:page",
  sValidator("param", paramsSchema),
  sValidator("query", querySchema),
  async (c) => {
    const params = c.req.valid("param");
    const query = c.req.valid("query");

    const searchResult = await search({
      page: params.page,
      size: query.size,
      q: query.q,
      sort: query.sort,
      filter: query.filter,
    });

    const response = buildResponse(c, searchResult);

    return c.json(response);
  },
);

function buildResponse(c: Context<Env>, searchResult: SearchResult) {
  const baseUri = new URL(c.req.url).origin + "/v1";

  const response = {
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
      id: `${baseUri}/heritage-objects/`,
      type: "OrderedCollection",
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
