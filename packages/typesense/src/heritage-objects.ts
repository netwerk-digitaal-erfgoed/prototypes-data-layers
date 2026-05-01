import { z } from "zod";
import { heritageObjectsSchema } from "./schemas.js";

const includeFields = [
  "$additional_types(*)",
  "$content_locations(*)",
  "$genres(*)",
  "$creators(*)",
  "$materials(*)",
  "$media_objects(*, $licenses(*))",
  "$licenses(*)",
  "$datasets(*)",
  "$publishers(*)",
  "$subjects(*)",
];

const excludeFields = [
  "additional_type",
  "additional_type_id",
  "content_location",
  "content_location_id",
  "creator",
  "creator_id",
  "genre",
  "genre_id",
  "material",
  "material_id",
  "media_object_id",
  "license_id",
  "license",
  "dataset",
  "dataset_id",
  "publisher",
  "publisher_id",
  "subject",
  "subject_id",
];

const searchInputSchema = z.object({
  page: z.number().default(1),
  size: z.number().default(10),
  sort: z.string().optional(),
  q: z.string(),
  // E.g. `creator:=John && material:=paper`
  filter: z.string().optional(),
});

type SearchInput = z.input<typeof searchInputSchema>;

const resourceHit = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
  }),
);

const license = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  is_based_on: z.string(),
});

const searchResultSchema = z.object({
  found: z.number(),
  page: z.number(),
  request_params: z.object({
    per_page: z.number(),
    q: z.string(),
  }),
  facet_counts: z.array(
    z.object({
      field_name: z.string(),
      counts: z.array(
        z.object({
          count: z.number(),
          value: z.string(),
        }),
      ),
    }),
  ),
  hits: z.array(
    z.object({
      document: z.object({
        id: z.string(),
        type: z.array(z.string()),
        name: z.string(),
        description: z.string().optional(),
        date_created: z.string().optional(),
        additional_types: resourceHit.optional(),
        content_locations: resourceHit.optional(),
        creators: resourceHit.optional(),
        genres: resourceHit.optional(),
        materials: resourceHit.optional(),
        subjects: resourceHit.optional(),
        publishers: z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
        }),
        datasets: z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
        }),
        licenses: license,
        is_based_on: z.object({
          id: z.string(),
          type: z.string(),
        }),
        media_objects: z
          .array(
            z.object({
              id: z.string(),
              type: z.array(z.string()),
              content_url: z.string(),
              thumbnail_url: z.string(),
              licenses: license,
              is_based_on: z
                .object({
                  id: z.string(),
                  type: z.string(),
                  encoding_format: z.string(),
                })
                .optional(),
            }),
          )
          .optional(),
      }),
    }),
  ),
});

export type SearchResult = z.output<typeof searchResultSchema>;

export async function search(input: SearchInput): Promise<SearchResult> {
  const opts = searchInputSchema.parse(input);

  const response = await heritageObjectsSchema.search({
    page: opts.page,
    per_page: opts.size,
    q: opts.q,
    // The order matters: "A document that matches on a field earlier in
    // the list of query_by fields is considered more relevant than a
    // document matched on a field later in the list."
    // (https://typesense.org/docs/guide/ranking-and-relevance.html)
    query_by: [
      "name",
      "description",
      "creator",
      "content_location",
      "additional_type",
      "genre",
      "material",
      "subject",
    ],
    filter_by: opts.filter !== undefined ? opts.filter : "",
    // @ts-expect-error - Typesense lib type struggle
    exclude_fields: excludeFields,
    // @ts-expect-error - Typesense lib doesn't support join fields
    include_fields: includeFields,
    facet_by: [
      "additional_type",
      "content_location",
      "creator",
      "dataset",
      "genre",
      "license",
      "material",
      "publisher",
      "subject",
    ],
  });

  const result = searchResultSchema.parse(response);

  return result;
}
