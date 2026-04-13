import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { z } from "zod";
import { Env } from "./env.js";
import { heritageObjectsSchema } from "@repo/typesense/schemas";

const app = new Hono<Env>();

const includeFields = [
  "$additional_types(*)",
  "$content_locations(*)",
  "$genres(*)",
  "$creators(*)",
  "$materials(*)",
  "$media_objects(*)",
  "$licenses(*)",
  "$datasets(*)",
  "$publishers(*)",
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
  "creator_id",
  "material",
  "material_id",
  "media_object_id",
  "license_id",
  "license",
  "dataset",
  "dataset_id",
  "publisher",
  "publisher_id",
];

const paramSchema = z.object({
  page: z.coerce.number().min(1).catch(1),
});

const querySchema = z.object({
  size: z.coerce.number().min(1).max(100).catch(10),
  sort: z.string().optional(),
  q: z.string().optional().default("*"), // "All"
  filter: z.union([z.string().transform((value) => [value]), z.array(z.string())]).catch([]),
});

app.get(
  "/heritage-objects/page/:page",
  sValidator("param", paramSchema),
  sValidator("query", querySchema),
  async (c) => {
    const param = c.req.valid("param");
    const query = c.req.valid("query");

    const results = await heritageObjectsSchema.search({
      page: param.page,
      per_page: query.size,
      q: query.q,
      query_by: ["name", "additional_type", "genre", "material", "content_location", "creator"],
      // @ts-expect-error - Typesense lib type struggle
      exclude_fields: excludeFields,
      // @ts-expect-error - Typesense lib does yet support join fields
      include_fields: includeFields,
      facet_by: [
        "additional_type",
        "genre",
        "material",
        "content_location",
        "creator",
        "license",
        "dataset",
        "publisher",
      ],
    });

    return c.json(results);
  },
);

export default app;
