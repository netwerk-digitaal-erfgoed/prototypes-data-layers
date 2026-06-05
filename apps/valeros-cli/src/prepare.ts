import { MediaObject } from "@repo/typesense/schemas";
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { chain } from "stream-chain";
import { jsonlStringer } from "stream-json/jsonl/stringer.js";
import parser from "stream-json/parser.js";
import { streamArray } from "stream-json/streamers/stream-array.js";
import { z } from "zod";

const prefix = "https://example.org/";

function createIdFrom(id: string) {
  return createHash("md5").update(id).digest("hex");
}

// Get the local name from an IRI, e.g. `Person` from `https://example.org/Person`
function getLocalName(iri: string) {
  if (iri.startsWith(prefix)) {
    return iri.slice(prefix.length);
  }

  return iri;
}

const idSchemaOne = z.object({ "@id": z.string() }).transform((data) => data["@id"]);

const idSchemaMultiple = z.preprocess(
  (value) => (Array.isArray(value) ? value : [value]),
  z.array(idSchemaOne),
);

const valueSchemaOne = z.object({ "@value": z.string() }).transform((data) => data["@value"]);

const valueSchemaMultiple = z.preprocess(
  (value) => (Array.isArray(value) ? value : [value]),
  z.array(valueSchemaOne),
);

const additionalTypeJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(z.string().transform((value) => getLocalName(value))),
      )
      .refine((values) => values.includes("DefinedTerm")),
    "https://example.org/name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "DefinedTerm",
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
  }));

const contentLocationJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(z.string().transform((value) => getLocalName(value))),
      )
      .refine((values) => values.includes("Place")),
    "https://example.org/name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Place",
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
  }));

const creatorJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(z.string().transform((value) => getLocalName(value))),
      )
      .refine((values) => values.includes("Person") || values.includes("Organization")),

    "https://example.org/name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: data["@type"][0],
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
  }));

const datasetJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(z.string().transform((value) => getLocalName(value))),
      )
      .refine((values) => values.includes("Dataset")),
    "https://example.org/name": valueSchemaMultiple,
    "https://example.org/license": idSchemaMultiple,
    "https://example.org/publisher": idSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Dataset",
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
    license_id: createIdFrom(data["https://example.org/license"][0]!),
    publisher_id: createIdFrom(data["https://example.org/publisher"][0]!),
  }));

const genreJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(z.string().transform((value) => getLocalName(value))),
      )
      .refine((values) => values.includes("DefinedTerm")),
    "https://example.org/name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "DefinedTerm",
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
  }));

const heritageObjectJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(z.string().transform((value) => getLocalName(value))),
      )
      .refine((values) => values.includes("CreativeWork")),
    "https://example.org/name": valueSchemaMultiple,
    "https://example.org/dateCreated": valueSchemaMultiple.optional(),
    "https://example.org/description": valueSchemaMultiple.optional(),
    "https://example.org/additionalType": idSchemaMultiple.optional(),
    "https://example.org/additionalTypeName": valueSchemaMultiple.optional(),
    "https://example.org/associatedMedia": idSchemaMultiple.optional(),
    "https://example.org/contentLocation": idSchemaMultiple.optional(),
    "https://example.org/contentLocationName": valueSchemaMultiple.optional(),
    "https://example.org/creator": idSchemaMultiple.optional(),
    "https://example.org/creatorName": valueSchemaMultiple.optional(),
    "https://example.org/dataset": idSchemaMultiple,
    "https://example.org/datasetName": valueSchemaMultiple,
    "https://example.org/genre": idSchemaMultiple.optional(),
    "https://example.org/genreName": valueSchemaMultiple.optional(),
    "https://example.org/license": idSchemaMultiple,
    "https://example.org/licenseName": valueSchemaMultiple,
    "https://example.org/material": idSchemaMultiple.optional(),
    "https://example.org/materialName": valueSchemaMultiple.optional(),
    "https://example.org/publisher": idSchemaMultiple,
    "https://example.org/publisherName": valueSchemaMultiple,
    "https://example.org/subject": idSchemaMultiple.optional(),
    "https://example.org/subjectName": valueSchemaMultiple.optional(),
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: data["@type"],
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
    date_created: data["https://example.org/dateCreated"]?.join("; "), // Merge into one string
    description: data["https://example.org/description"]?.join("; "), // Merge into one string
    additional_type: data["https://example.org/additionalTypeName"],
    additional_type_id: data["https://example.org/additionalType"]?.map((id) => createIdFrom(id)),
    media_object_id: data["https://example.org/associatedMedia"]?.map((id) => {
      // Hack: if the ID does not start with the prefix,
      // it's an IRI of a IIIF manifest file
      if (!id.startsWith(prefix)) {
        return id; // Return the ID as-is
      }
      return createIdFrom(id);
    }),
    content_location: data["https://example.org/contentLocationName"],
    content_location_id: data["https://example.org/contentLocation"]?.map((id) => createIdFrom(id)),
    creator: data["https://example.org/creatorName"],
    creator_id: data["https://example.org/creator"]?.map((id) => createIdFrom(id)),
    dataset: data["https://example.org/datasetName"]?.join("; "), // Merge into one string,,
    dataset_id: createIdFrom(data["https://example.org/dataset"][0]!),
    genre: data["https://example.org/genreName"],
    genre_id: data["https://example.org/genre"]?.map((id) => createIdFrom(id)),
    license: data["https://example.org/licenseName"]?.join("; "), // Merge into one string,
    license_id: createIdFrom(data["https://example.org/license"][0]!),
    material: data["https://example.org/materialName"],
    material_id: data["https://example.org/material"]?.map((id) => createIdFrom(id)),
    publisher: data["https://example.org/publisherName"]?.join("; "), // Merge into one string,,
    publisher_id: createIdFrom(data["https://example.org/publisher"][0]!),
    subject: data["https://example.org/subjectName"],
    subject_id: data["https://example.org/subject"]?.map((id) => createIdFrom(id)),
    is_based_on: {
      id: data["@id"],
      type: "CreativeWork",
    },
  }));

const licenseJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(z.string().transform((value) => getLocalName(value))),
      )
      .refine((values) => values.includes("License")),
    "https://example.org/name": valueSchemaMultiple,
    "https://example.org/isBasedOn": idSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "CreativeWork",
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
    is_based_on: data["https://example.org/isBasedOn"][0],
  }));

const materialJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(z.string().transform((value) => getLocalName(value))),
      )
      .refine((values) => values.includes("DefinedTerm")),
    "https://example.org/name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "DefinedTerm", // Keep only this type
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
  }));

const fullMediaObjectJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.preprocess(
      (value) => (Array.isArray(value) ? value : [value]),
      z.array(
        z
          .enum(["https://example.org/MediaObject", "https://example.org/ImageObject"])
          .transform((value) => getLocalName(value)),
      ),
    ),
    "https://example.org/contentUrl": idSchemaMultiple,
    "https://example.org/thumbnailUrl": idSchemaMultiple,
    "https://example.org/license": idSchemaMultiple,
    "https://example.org/isBasedOn": idSchemaMultiple.optional(),
  })
  .transform((data) => {
    const mediaObject: MediaObject = {
      id: createIdFrom(data["@id"]),
      type: data["@type"],
      content_url: data["https://example.org/contentUrl"][0],
      thumbnail_url: data["https://example.org/thumbnailUrl"][0],
      license_id: createIdFrom(data["https://example.org/license"][0]!),
    };

    // IIIF Image API support is optional
    if (data["https://example.org/isBasedOn"]) {
      mediaObject.is_based_on = {
        id: data["https://example.org/isBasedOn"][0]!,
        type: "CreativeWork", // TBD: correct? Necessary?
        encoding_format: "application/ld+json;profile='http://iiif.io/api/image/3/context.json'",
      };
    }

    return mediaObject;
  });

const iiifPresentationApiMediaObjectJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.preprocess(
      (value) => (Array.isArray(value) ? value : [value]),
      z.array(
        z.enum(["https://example.org/MediaObject"]).transform((value) => getLocalName(value)),
      ),
    ),
    "https://example.org/encodingFormat": valueSchemaMultiple.refine(
      (values) =>
        values[0] ===
        "application/ld+json;profile='http://iiif.io/api/presentation/3/context.json'",
    ),
  })
  .transform((data) => ({
    id: data["@id"], // Original link to the manifest
    type: data["@type"],
    encoding_format: data["https://example.org/encodingFormat"][0],
  }));

const mediaObjectJsonLdSchema = z.union([
  fullMediaObjectJsonLdSchema,
  iiifPresentationApiMediaObjectJsonLdSchema,
]);

const organizationJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(z.string().transform((value) => getLocalName(value))),
      )
      .refine((values) => values.includes("Organization")),
    "https://example.org/name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Organization",
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
  }));

const personJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(z.string().transform((value) => getLocalName(value))),
      )
      .refine((values) => values.includes("Person")),
    "https://example.org/name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Person",
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
  }));

const placeJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(z.string().transform((value) => getLocalName(value))),
      )
      .refine((values) => values.includes("Place")),
    "https://example.org/name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "Place",
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
  }));

const publisherJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(z.string().transform((value) => getLocalName(value))),
      )
      .refine((values) => values.includes("Organization")),
    "https://example.org/name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: data["@type"][0],
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
  }));

// Beware: a subject can also refer to e.g. a person or a creative work, not just a term
const subjectJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(
          z
            .enum([
              "https://example.org/Person",
              "https://example.org/Organization",
              "https://example.org/Place",
              "https://example.org/CreativeWork",
              "https://example.org/DefinedTerm",
            ])
            .transform((value) => getLocalName(value)),
        ),
      )
      .transform((values) => {
        // Return the primary type of the subject
        // (not combinations, e.g. `Person` *and* `DefinedTerm`)
        if (values.includes("Person")) {
          return "Person";
        }
        if (values.includes("Organization")) {
          return "Organization";
        }
        if (values.includes("Place")) {
          return "Place";
        }
        if (values.includes("CreativeWork")) {
          return "CreativeWork";
        }
        return "DefinedTerm";
      }),
    "https://example.org/name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: data["@type"],
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
  }));

const termJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z
      .preprocess(
        (value) => (Array.isArray(value) ? value : [value]),
        z.array(z.string().transform((value) => getLocalName(value))),
      )
      .refine((values) => values.includes("DefinedTerm")),
    "https://example.org/name": valueSchemaMultiple,
  })
  .transform((data) => ({
    id: createIdFrom(data["@id"]),
    type: "DefinedTerm",
    name: data["https://example.org/name"]?.join("; "), // Merge into one string
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
      parser(),
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
      name: "02.datasets.jsonl",
      schema: datasetJsonLdSchema,
    },
    {
      name: "01.genres.jsonl",
      schema: genreJsonLdSchema,
    },
    {
      name: "04.heritage_objects.jsonl",
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
      name: "03.media_objects.jsonl",
      schema: mediaObjectJsonLdSchema,
    },
    {
      name: "01.organizations.jsonl",
      schema: organizationJsonLdSchema,
    },
    {
      name: "01.persons.jsonl",
      schema: personJsonLdSchema,
    },
    {
      name: "01.places.jsonl",
      schema: placeJsonLdSchema,
    },
    {
      name: "01.publishers.jsonl",
      schema: publisherJsonLdSchema,
    },
    {
      name: "01.subjects.jsonl",
      schema: subjectJsonLdSchema,
    },
    {
      name: "01.terms.jsonl",
      schema: termJsonLdSchema,
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
