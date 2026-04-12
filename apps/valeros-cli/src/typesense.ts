import { collection, setDefaultConfiguration } from "typesense-ts";
import { env } from "node:process";

setDefaultConfiguration({
  apiKey: env.TYPESENSE_API_KEY!,
  nodes: [{ url: env.TYPESENSE_HOST! }],
});

const additionalTypeSchema = collection({
  name: "additional_types",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
});

const contentLocationsSchema = collection({
  name: "content_locations",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
});

const creatorsSchema = collection({
  name: "creators",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
});

const datasetsSchema = collection({
  name: "datasets",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
});

const genresSchema = collection({
  name: "genres",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
});

const heritageObjectsSchema = collection({
  name: "heritage_objects",
  enable_nested_fields: true,
  fields: [
    { name: "type", type: "string[]" },
    { name: "additional_type", type: "string[]", optional: true, facet: true },
    {
      name: "additional_type_id",
      type: "string[]",
      optional: true,
      reference: "additional_types.id",
    },
    { name: "content_location", type: "string[]", optional: true, facet: true },
    {
      name: "content_location_id",
      type: "string[]",
      optional: true,
      reference: "content_locations.id",
    },
    { name: "creator", type: "string[]", optional: true, facet: true },
    { name: "creator_id", type: "string[]", optional: true, reference: "creators.id" },
    { name: "date_created", type: "string", optional: true },
    { name: "dataset", type: "string", facet: true },
    { name: "dataset_id", type: "string", reference: "datasets.id" },
    { name: "description", type: "string", optional: true },
    { name: "genre", type: "string[]", optional: true, facet: true },
    { name: "genre_id", type: "string[]", optional: true, reference: "genres.id" },
    { name: "is_based_on", type: "object" },
    { name: "is_based_on.id", type: "string" },
    { name: "is_based_on.type", type: "string" },
    { name: "license", type: "string", facet: true },
    { name: "license_id", type: "string", reference: "licenses.id" },
    { name: "material", type: "string[]", optional: true, facet: true },
    { name: "material_id", type: "string[]", optional: true, reference: "materials.id" },
    { name: "media_object_id", type: "string[]", optional: true, reference: "media_objects.id" },
    { name: "name", type: "string" },
    { name: "publisher", type: "string", facet: true },
    { name: "publisher_id", type: "string", reference: "publishers.id" },
  ],
});

const licensesSchema = collection({
  name: "licenses",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
    { name: "is_based_on", type: "string" },
  ],
});

const materialsSchema = collection({
  name: "materials",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
});

const mediaObjectsSchema = collection({
  name: "media_objects",
  enable_nested_fields: true,
  fields: [
    { name: "type", type: "string[]" },
    { name: "content_url", type: "string" },
    { name: "thumbnail_url", type: "string" },
    { name: "license_id", type: "string" },
    { name: "is_based_on", type: "object", optional: true },
    { name: "is_based_on.id", type: "string" },
    { name: "is_based_on.type", type: "string" },
    { name: "is_based_on.encoding_format", type: "string" },
  ],
});

const publishersSchema = collection({
  name: "publishers",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
});

// Register the collections globally for type safety
declare module "typesense-ts" {
  interface Collections {
    additionalTypes: typeof additionalTypeSchema.schema;
    contentLocations: typeof contentLocationsSchema.schema;
    creators: typeof creatorsSchema.schema;
    datasets: typeof datasetsSchema.schema;
    genres: typeof genresSchema.schema;
    heritageObjects: typeof heritageObjectsSchema.schema;
    licenses: typeof licensesSchema.schema;
    materials: typeof materialsSchema.schema;
    mediaObjects: typeof mediaObjectsSchema.schema;
    publishers: typeof publishersSchema.schema;
  }
}

// @ts-expect-error "Type instantiation is excessively deep and possibly infinite."
export const collectionSchemas = [
  additionalTypeSchema,
  contentLocationsSchema,
  creatorsSchema,
  datasetsSchema,
  genresSchema,
  heritageObjectsSchema,
  licensesSchema,
  materialsSchema,
  mediaObjectsSchema,
  publishersSchema,
];

export type CollectionSchema = (typeof collectionSchemas)[number];
