import { env } from "node:process";
import { setConfiguration } from "@repo/typesense/client";
import {
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
} from "@repo/typesense/schemas";

setConfiguration({
  apiKey: env.TYPESENSE_API_KEY!,
  host: env.TYPESENSE_HOST!,
});

// @ts-expect-error - "Type instantiation is excessively deep and possibly infinite."
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
