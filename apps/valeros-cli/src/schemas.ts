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

export const additionalTypeJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:AdditionalType"),
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
    "@type": z.literal("ext:ContentLocation"),
    "ext:name": valueSchema,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Place",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

export const creatorJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:Creator"),
    "ext:name": valueSchema,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Person",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

export const datasetJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:Dataset"),
    "ext:name": valueSchema,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Dataset",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

export const genreJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:Genre"),
    "ext:name": valueSchema,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "DefinedTerm",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

export const heritageObjectJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:CreativeWork"),
    "ext:name": valueSchema,
    "ext:dateCreated": valueSchema.optional(),
    "ext:description": valueSchema.optional(),
    "ext:additionalType": idSchema.optional(),
    "ext:additionalTypeName": valueSchema.optional(),
    "ext:associatedMedia": idSchema.optional(),
    "ext:contentLocation": idSchema.optional(),
    "ext:contentLocationName": valueSchema.optional(),
    "ext:creator": idSchema,
    "ext:creatorName": valueSchema,
    "ext:isPartOf": idSchema,
    "ext:datasetName": valueSchema,
    "ext:genre": idSchema.optional(),
    "ext:genreName": valueSchema.optional(),
    "ext:license": idSchema,
    "ext:licenseName": valueSchema,
    "ext:material": idSchema.optional(),
    "ext:materialName": valueSchema.optional(),
    "ext:publisher": idSchema,
    "ext:publisherName": valueSchema,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "CreativeWork",
    name: data["ext:name"]?.join("; "), // Merge into one string
    date_created: data["ext:dateCreated"]?.join("; "), // Merge into one string
    description: data["ext:description"]?.join("; "), // Merge into one string
    additional_type: data["ext:additionalTypeName"],
    additional_type_id: data["ext:additionalType"]?.map((id) => createIdFrom(id)),
    media_object_id: data["ext:associatedMedia"]?.map((id) => createIdFrom(id)),
    content_location: data["ext:contentLocationName"],
    content_location_id: data["ext:contentLocation"]?.map((id) => createIdFrom(id)),
    creator: data["ext:creatorName"],
    creator_id: data["ext:creator"]?.map((id) => createIdFrom(id)),
    dataset: data["ext:datasetName"],
    dataset_id: data["ext:isPartOf"]?.map((id) => createIdFrom(id)),
    genre: data["ext:genreName"],
    genre_id: data["ext:genre"]?.map((id) => createIdFrom(id)),
    license: data["ext:licenseName"],
    license_id: data["ext:license"]?.map((id) => createIdFrom(id)),
    material: data["ext:materialName"],
    material_id: data["ext:material"]?.map((id) => createIdFrom(id)),
    publisher: data["ext:publisherName"],
    publisher_id: data["ext:publisher"]?.map((id) => createIdFrom(id)),
    is_based_on: {
      id: data["@id"],
      type: "CreativeWork",
    },
  }));

export const licensesJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:License"),
    "ext:name": valueSchema,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "CreativeWork",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

export const materialJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:Material"),
    "ext:name": valueSchema,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "DefinedTerm",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

export const mediaObjectJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.preprocess(
      (value) => (Array.isArray(value) ? value : [value]),
      z.array(
        z
          .enum(["schema:MediaObject", "schema:ImageObject"])
          .transform((data) => data.replace("schema:", "")), // Remove prefix
      ),
    ),
    "ext:contentUrl": z.string(),
    "ext:thumbnailUrl": z.string(),
    "ext:license": idSchema,
    "ext:isBasedOn": z
      .object({
        "@id": z.string(),
      })
      .optional(),
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: data["@type"],
    content_url: data["ext:contentUrl"],
    thumbnail_url: data["ext:thumbnailUrl"],
    license_id: data["ext:license"]?.map((id) => createIdFrom(id)),
    is_based_on: {
      id: data["ext:isBasedOn"]!["@id"],
      type: "CreativeWork",
      encoding_format: "application/ld+json;profile='http://iiif.io/api/image/3/context.json'",
    },
  }));

export const publishersJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:Organization"),
    "ext:name": valueSchema,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Organization",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));
