import { z } from "zod";
import { createHash } from "node:crypto";

function createIdFrom(id: string) {
  return createHash("md5").update(id).digest("hex");
}

const idSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value : [value]),
  z.array(z.object({ "@id": z.string() }).transform((data) => data["@id"])),
);

const valueSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value : [value]),
  z.array(z.object({ "@value": z.string() }).transform((data) => data["@value"])),
);

export const heritageObjectJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.enum(["ext:CreativeWork"]),
    "ext:name": valueSchema,
    "ext:description": valueSchema.optional(),
    "ext:additionalType": idSchema.optional(),
    "ext:additionalTypeNames": valueSchema.optional(),
    "ext:genre": idSchema.optional(),
    "ext:genreNames": valueSchema.optional(),
    "ext:contentLocation": idSchema.optional(),
    "ext:contentLocationNames": valueSchema.optional(),
    "ext:material": idSchema.optional(),
    "ext:materialNames": valueSchema.optional(),
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "CreativeWork",
    name: data["ext:name"]?.join("; "), // Merge into one string
    description: data["ext:description"]?.join("; "), // Merge into one string
    additional_types: data["ext:additionalTypeNames"],
    additional_type_id: data["ext:additionalType"]?.map((id) => createIdFrom(id)),
    genres: data["ext:genreNames"],
    genre_id: data["ext:genre"]?.map((id) => createIdFrom(id)),
    content_locations: data["ext:contentLocationNames"],
    content_location_id: data["ext:contentLocation"]?.map((id) => createIdFrom(id)),
    materials: data["ext:materialNames"],
    material_id: data["ext:material"]?.map((id) => createIdFrom(id)),
    isBasedOn: {
      id: data["@id"],
      type: "CreativeWork",
    },
  }));

export const additionalTypeJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.enum(["ext:AdditionalType"]),
    "ext:name": valueSchema,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "DefinedTerm",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

export const genreJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.enum(["ext:Genre"]),
    "ext:name": valueSchema,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "DefinedTerm",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

export const contentLocationJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.enum(["ext:ContentLocation"]),
    "ext:name": valueSchema,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Place",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

export const materialJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.enum(["ext:Material"]),
    "ext:name": valueSchema,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "DefinedTerm",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));
