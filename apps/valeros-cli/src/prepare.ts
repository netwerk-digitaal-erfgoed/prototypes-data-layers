import { MediaObject } from "@repo/typesense/schemas";
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { chain } from "stream-chain";
import { pick } from "stream-json/filters/pick.js";
import { jsonlStringer } from "stream-json/jsonl/stringer.js";
import { streamArray } from "stream-json/streamers/stream-array.js";
import { z } from "zod";

function createIdFrom(id: string) {
  return createHash("md5").update(id).digest("hex");
}

const idSchemaOne = z.object({ "@id": z.string() }).transform((data) => data["@id"]);

const idSchemaMultiple = z.preprocess(
  (value) => (Array.isArray(value) ? value : [value]),
  z.array(idSchemaOne),
);

// Plain literal, without a language tag (e.g. a date)
const literalSchemaMultiple = z.preprocess(
  (value) => (Array.isArray(value) ? value : [value]),
  z.array(z.string()),
);

const valueSchemaOne = z.object({ "@value": z.string() }).transform((data) => data["@value"]);

const valueSchemaMultiple = z.preprocess(
  (value) => (Array.isArray(value) ? value : [value]),
  z.array(valueSchemaOne),
);

const additionalTypeJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:AdditionalType"),
    "ext:name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "DefinedTerm",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

const contentLocationJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:ContentLocation"),
    "ext:name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Place",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

const creatorJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:Creator"),
    "ext:name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Person",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

const datasetJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:Dataset"),
    "ext:name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Dataset",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

const genreJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:Genre"),
    "ext:name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "DefinedTerm",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

const heritageObjectJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.preprocess(
      (value) => (Array.isArray(value) ? value : [value]),
      z.array(
        // Remove prefix, e.g. `schema:CreativeWork` or `sdo:Chapter`
        z.string().transform((data) => data.replace(/^.*:/, "")),
      ),
    ),
    "ext:name": valueSchemaMultiple,
    "ext:dateCreated": literalSchemaMultiple.optional(),
    "ext:description": valueSchemaMultiple.optional(),
    "ext:additionalType": idSchemaMultiple.optional(),
    "ext:additionalTypeName": valueSchemaMultiple.optional(),
    "ext:associatedMedia": idSchemaMultiple.optional(),
    "ext:contentLocation": idSchemaMultiple.optional(),
    "ext:contentLocationName": valueSchemaMultiple.optional(),
    "ext:creator": idSchemaMultiple,
    "ext:creatorName": valueSchemaMultiple,
    "ext:dataset": idSchemaOne,
    "ext:datasetName": valueSchemaOne,
    "ext:genre": idSchemaMultiple.optional(),
    "ext:genreName": valueSchemaMultiple.optional(),
    "ext:license": idSchemaOne,
    "ext:licenseName": valueSchemaOne,
    "ext:material": idSchemaMultiple.optional(),
    "ext:materialName": valueSchemaMultiple.optional(),
    "ext:publisher": idSchemaOne,
    "ext:publisherName": valueSchemaOne,
    "ext:subject": idSchemaMultiple.optional(),
    "ext:subjectName": valueSchemaMultiple.optional(),
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: data["@type"],
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
    dataset_id: createIdFrom(data["ext:dataset"]),
    genre: data["ext:genreName"],
    genre_id: data["ext:genre"]?.map((id) => createIdFrom(id)),
    license: data["ext:licenseName"],
    license_id: createIdFrom(data["ext:license"]),
    material: data["ext:materialName"],
    material_id: data["ext:material"]?.map((id) => createIdFrom(id)),
    publisher: data["ext:publisherName"],
    publisher_id: createIdFrom(data["ext:publisher"]),
    subject: data["ext:subjectName"],
    subject_id: data["ext:subject"]?.map((id) => createIdFrom(id)),
    is_based_on: {
      id: data["@id"],
      type: "CreativeWork",
    },
  }));

const licenseJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:License"),
    "ext:name": valueSchemaMultiple,
    "ext:isBasedOn": idSchemaOne,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "CreativeWork",
    name: data["ext:name"]?.join("; "), // Merge into one string
    is_based_on: data["ext:isBasedOn"],
  }));

const materialJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:Material"),
    "ext:name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "DefinedTerm",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

const mediaObjectJsonLdSchema = z
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
    "ext:contentUrl": idSchemaOne,
    "ext:thumbnailUrl": idSchemaOne,
    "ext:license": idSchemaOne,
    "ext:isBasedOn": idSchemaOne.optional(),
  })
  .transform((data) => {
    const mediaObject: MediaObject = {
      id: createIdFrom(data["@id"]),
      type: data["@type"],
      content_url: data["ext:contentUrl"],
      thumbnail_url: data["ext:thumbnailUrl"],
      license_id: createIdFrom(data["ext:license"]),
    };

    // IIIF support is optional
    if (data["ext:isBasedOn"]) {
      mediaObject.is_based_on = {
        id: data["ext:isBasedOn"],
        type: "CreativeWork",
        encoding_format: "application/ld+json;profile='http://iiif.io/api/image/3/context.json'",
      };
    }

    return mediaObject;
  });

const publisherJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:Organization"),
    "ext:name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Organization",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

const subjectJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.literal("ext:Subject"),
    "ext:name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    // TBD: a subject can also refer to a person or a creative work, not just a term
    type: "DefinedTerm",
    name: data["ext:name"]?.join("; "), // Merge into one string
  }));

const toJsonLinesFileInputSchema = z.object({
  inputFile: z.string(),
  outputFile: z.string(),
  schema: z.instanceof(z.ZodType),
});

type ToJsonLinesFileInput = z.input<typeof toJsonLinesFileInputSchema>;

async function toJsonLinesFile(input: ToJsonLinesFileInput) {
  const opts = toJsonLinesFileInputSchema.parse(input);

  const schema = z.object({ value: input.schema });

  const parseResource = (data: any) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      return null; // Ignore data
    }

    return result.data.value; // Valid data
  };

  await new Promise<void>((resolve, reject) => {
    const pipeline = chain([
      createReadStream(opts.inputFile),
      pick.withParser({ filter: "@graph" }),
      streamArray(),
      parseResource,
      jsonlStringer(),
      createWriteStream(opts.outputFile),
    ]);

    pipeline.on("end", resolve);
    pipeline.on("error", reject);
  });
}

const prepareInputSchema = z.object({
  inputFile: z.string(),
  outputDir: z.string(),
});

type PrepareInput = z.input<typeof prepareInputSchema>;

export async function prepare(input: PrepareInput) {
  const opts = prepareInputSchema.parse(input);

  // Remove files from a previous run, if any
  await rm(input.outputDir, { recursive: true, force: true });
  await mkdir(input.outputDir, { recursive: true });

  // The names of the files are significant: these determine the
  // import order and the names of the collections in the search index
  const files = [
    {
      name: "01.additional_types.jsonl",
      schema: additionalTypeJsonLdSchema,
    },
    {
      name: "01.content_locations.jsonl",
      schema: contentLocationJsonLdSchema,
    },
    {
      name: "01.creators.jsonl",
      schema: creatorJsonLdSchema,
    },
    {
      name: "01.datasets.jsonl",
      schema: datasetJsonLdSchema,
    },
    {
      name: "01.genres.jsonl",
      schema: genreJsonLdSchema,
    },
    {
      name: "03.heritage_objects.jsonl",
      schema: heritageObjectJsonLdSchema,
    },
    {
      name: "01.licenses.jsonl",
      schema: licenseJsonLdSchema,
    },
    {
      name: "01.materials.jsonl",
      schema: materialJsonLdSchema,
    },
    {
      name: "02.media_objects.jsonl",
      schema: mediaObjectJsonLdSchema,
    },
    {
      name: "01.publishers.jsonl",
      schema: publisherJsonLdSchema,
    },
    {
      name: "01.subjects.jsonl",
      schema: subjectJsonLdSchema,
    },
  ];

  for (let file of files) {
    const outputFile = path.join(input.outputDir, file.name);

    await toJsonLinesFile({
      inputFile: opts.inputFile,
      outputFile: outputFile,
      schema: file.schema,
    });
  }
}
