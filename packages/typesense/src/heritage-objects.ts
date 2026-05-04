import { Client, Errors } from "typesense";
import { z } from "zod";

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

const termSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
  }),
);

const licenseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  is_based_on: z.string(),
});

const documentSchema = z.object({
  id: z.string(),
  type: z.array(z.string()),
  name: z.string(),
  description: z.string().optional(),
  date_created: z.string().optional(),
  additional_types: termSchema.optional(),
  content_locations: termSchema.optional(),
  creators: termSchema.optional(),
  genres: termSchema.optional(),
  materials: termSchema.optional(),
  subjects: termSchema.optional(),
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
  licenses: licenseSchema,
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
        licenses: licenseSchema,
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
});

export type Document = z.output<typeof documentSchema>;

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
      document: documentSchema,
    }),
  ),
});

export type SearchResult = z.output<typeof searchResultSchema>;

const searchInputSchema = z.object({
  client: z.instanceof(Client),
  page: z.number().default(1),
  size: z.number().default(10),
  sort: z.string().optional(),
  q: z.string(),
  // E.g. `creator:=John && material:=paper`
  filter: z.string().optional(),
});

type SearchInput = z.input<typeof searchInputSchema>;

export async function search(input: SearchInput): Promise<SearchResult> {
  const opts = searchInputSchema.parse(input);

  const response = await opts.client
    .collections("heritage_objects")
    .documents()
    .search({
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
      filter_by: opts.filter,
      exclude_fields: excludeFields,
      include_fields: includeFields,
    });

  const result = searchResultSchema.parse(response);

  return result;
}

const retrieveInputSchema = z.object({
  client: z.instanceof(Client),
  id: z.string(),
});

type RetrieveInput = z.input<typeof retrieveInputSchema>;

export async function retrieve(input: RetrieveInput): Promise<Document | undefined> {
  const opts = retrieveInputSchema.parse(input);

  try {
    const response = await opts.client.collections("heritage_objects").documents(opts.id).retrieve({
      include_fields: includeFields,
      exclude_fields: excludeFields,
    });

    return documentSchema.parse(response);
  } catch (err) {
    if (err instanceof Errors.ObjectNotFound) {
      return undefined;
    }

    throw err;
  }
}
